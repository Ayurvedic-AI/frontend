/**
 * Tests for the silent-refresh layer in `client.ts`:
 *  - a 401 triggers exactly one POST /auth/refresh and one retry;
 *  - the refresh is serialized ACROSS TABS via the Web Locks API when the
 *    browser provides it (jsdom does not, so we stub `navigator.locks`);
 *  - without Web Locks it falls back to the per-tab single-flight guard.
 *
 * Cross-tab serialization matters because the backend rotates the refresh
 * token on every use: two tabs firing /auth/refresh concurrently make the
 * loser present an already-rotated token, which reuse detection treats as
 * theft and revokes the whole session chain (= surprise logout).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type ClientModule = typeof import('../client');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let fetchMock: ReturnType<typeof vi.fn>;

/** Route fetches: app paths 401 until a refresh succeeds, then 200. */
function routeFetch() {
  let refreshed = false;
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/auth/refresh')) {
      refreshed = true;
      return json({ user: { uuid: 'u1' } });
    }
    return refreshed ? json({ ok: true }) : json({ detail: 'expired' }, 401);
  });
}

function fetchedUrls(): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]));
}

/** Fresh module per test — resets the module-level single-flight promise. */
async function freshClient(): Promise<ClientModule> {
  vi.resetModules();
  return import('../client');
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as { locks?: unknown }).locks;
});

describe('silent refresh on 401', () => {
  it('refreshes once and retries the original request', async () => {
    routeFetch();
    const { apiFetch } = await freshClient();

    const result = await apiFetch<{ ok: boolean }>('/api/v1/admin/things');

    expect(result).toEqual({ ok: true });
    const urls = fetchedUrls();
    expect(urls).toHaveLength(3); // original 401 → refresh → retry
    expect(urls[1]).toContain('/auth/refresh');
  });

  it('serializes the refresh through navigator.locks when available', async () => {
    routeFetch();
    const lockNames: string[] = [];
    const request = vi.fn(
      async (name: string, cb: () => Promise<unknown>) => {
        lockNames.push(name);
        return cb();
      },
    );
    Object.defineProperty(navigator, 'locks', {
      value: { request },
      configurable: true,
    });

    const { apiFetch } = await freshClient();
    await apiFetch('/api/v1/admin/things');

    expect(request).toHaveBeenCalledTimes(1);
    expect(lockNames).toEqual(['svm-auth-refresh']);
    // The refresh POST itself ran inside the lock callback.
    expect(fetchedUrls().filter((u) => u.includes('/auth/refresh'))).toHaveLength(1);
  });

  it('falls back to the per-tab single-flight guard without Web Locks', async () => {
    routeFetch();
    const { apiFetch } = await freshClient();

    // Two requests 401 at the same moment — both must share ONE refresh.
    const [a, b] = await Promise.all([
      apiFetch<{ ok: boolean }>('/api/v1/admin/a'),
      apiFetch<{ ok: boolean }>('/api/v1/admin/b'),
    ]);

    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(fetchedUrls().filter((u) => u.includes('/auth/refresh'))).toHaveLength(1);
  });
});

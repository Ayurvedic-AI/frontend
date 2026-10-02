/**
 * Unit tests for the SDK mutator (`src/api/sdk-mutator.ts`).
 *
 * The mutator is the single delegation seam between Orval-generated code and
 * the hand-written `apiFetch` in `client.ts`. These tests stub `apiFetch` and
 * verify the mutator translates Orval's two-arg call shape correctly,
 * detects form-encoded bodies, surfaces ApiError unchanged, and passes
 * cookies/CSRF concerns through to the existing client.
 *
 * Cookies + CSRF themselves are tested in `client.ts` consumers and the
 * AuthContext suite; the seam itself is small and high-leverage, so we
 * verify it directly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ApiError } from '../client';
import { mutator } from '../sdk-mutator';

// Mock apiFetchWithMeta — the mutator must call it with the right shape.
vi.mock('../client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../client')>();
  return {
    ...actual,
    apiFetchWithMeta: vi.fn(),
  };
});

// Re-import after mocking to capture the mocked symbol.
import { apiFetchWithMeta } from '../client';
const apiFetchMock = apiFetchWithMeta as unknown as ReturnType<typeof vi.fn>;

// Helper to wrap a body in the envelope shape apiFetchWithMeta returns.
function envelope<T>(data: T, status = 200, headers = new Headers()) {
  return { data, status, headers };
}

beforeEach(() => {
  apiFetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mutator — content-type branching (FR-014)', () => {
  it('passes form: true for application/x-www-form-urlencoded bodies', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope({ user: { id: 1, email: 'a@b.com', role: 'user' } }));

    const body = new URLSearchParams();
    body.append('username', 'alice@example.com');
    body.append('password', 'hunter2');

    await mutator<unknown>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledUrl).toBe('/api/v1/auth/login');
    expect(calledInit.method).toBe('POST');
    expect(calledInit.form).toBe(true);
    expect(calledInit.body).toBe(body);
  });

  it('passes form: false for application/json bodies', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));

    await mutator<unknown>('/api/v1/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: 'old', new_password: 'newStrong-9!Q' }),
    });

    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledInit.form).toBe(false);
  });

  it('detects the header case-insensitively (lowercase content-type)', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));

    await mutator<unknown>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(),
    });

    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledInit.form).toBe(true);
  });

  it('treats missing Content-Type as non-form (defaults to JSON)', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));
    await mutator<unknown>('/api/v1/auth/logout', { method: 'POST' });
    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledInit.form).toBe(false);
  });
});

describe('mutator — URL composition (FR-015)', () => {
  it('passes the URL through unchanged when there are no query params', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));
    await mutator('/api/v1/auth/me', { method: 'GET' });
    const [calledUrl] = apiFetchMock.mock.calls[0] as [string];
    expect(calledUrl).toBe('/api/v1/auth/me');
  });

  // Orval emits query params into the URL itself before calling the mutator,
  // so the mutator does NOT need to compose them. We leave the helper
  // function in the module for endpoints that pass `params` directly, but
  // the typical flow is Orval-rendered URLs.
});

describe('mutator — error pass-through (FR-013, D-006)', () => {
  it('rethrows ApiError unchanged so consumers can `e instanceof ApiError`', async () => {
    const err = new ApiError(401, { detail: 'Invalid credentials' });
    apiFetchMock.mockRejectedValueOnce(err);

    await expect(
      mutator('/api/v1/auth/me', { method: 'GET' }),
    ).rejects.toBe(err);
  });

  it('preserves status and body on the thrown ApiError', async () => {
    const err = new ApiError(422, { detail: 'Password fails policy', violations: ['min_length_10'] });
    apiFetchMock.mockRejectedValueOnce(err);

    try {
      await mutator('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: 'x', new_password: 'too-short' }),
      });
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(422);
      expect((e as ApiError).body).toEqual({
        detail: 'Password fails policy',
        violations: ['min_length_10'],
      });
    }
  });
});

describe('mutator — method handling', () => {
  it('uppercases lowercase methods (defensive)', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));
    // Defensive uppercase: pass lowercase, expect uppercase forwarded to apiFetch.
    await mutator('/x', { method: 'post' as 'POST' });
    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledInit.method).toBe('POST');
  });

  it('defaults to GET when method is omitted', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));
    await mutator('/x', {});
    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledInit.method).toBe('GET');
  });
});

describe('mutator — headers normalization', () => {
  it('accepts a plain object headers record', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));
    await mutator('/x', { method: 'GET', headers: { Authorization: 'Bearer xyz' } });
    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect((calledInit.headers as Record<string, string>).Authorization).toBe('Bearer xyz');
  });

  it('accepts a Headers instance', async () => {
    apiFetchMock.mockResolvedValueOnce(envelope(undefined, 204));
    const h = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    await mutator('/x', { method: 'POST', headers: h });
    const [, calledInit] = apiFetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(calledInit.form).toBe(true);
  });
});

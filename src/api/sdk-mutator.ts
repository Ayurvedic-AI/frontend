/**
 * HAND-WRITTEN — do NOT delete. This is the single delegation seam (FR-012)
 * between Orval-generated SDK code (in `src/sdk/`) and the existing fetcher
 * in `src/api/client.ts`. Cookie attachment (FR-010), CSRF header injection
 * (FR-011), and `ApiError` mapping (FR-013) live in `client.ts`; this file
 * only routes Orval's call shape onto that fetcher.
 *
 * Lives at `src/api/sdk-mutator.ts` (NOT under `src/sdk/`) because Orval's
 * `clean` glob does not reliably honor negations — placing the file under
 * the generator's output target would risk it being deleted on each regen.
 * Co-locating with `client.ts` is also semantically correct: this is part
 * of the HTTP layer, not part of the generated SDK.
 *
 * The `csrf_token` cookie itself is read by `client.ts` via `./csrf.ts`.
 * Feature code MUST NOT import `csrf.ts` directly (FR-018) — only the
 * central fetcher consumes it.
 *
 * Orval (v8 with `client: 'react-query'`) calls the mutator with the shape
 * `mutator(url, init)` where `init` is a `RequestInit`-ish object including
 * `method`, `headers`, and a pre-encoded `body`. The mutator translates that
 * into a single `apiFetchWithMeta()` call and returns the wrapped envelope
 * `{ data, status, headers }` so the generator's discriminated-union return
 * types are accurate at runtime. See:
 *   - specs/004-frontend-orval-sdk/plan.md           (project structure)
 *   - specs/004-frontend-orval-sdk/research.md       (D-003, D-005, D-006)
 *   - specs/004-frontend-orval-sdk/contracts/sdk-gen-command.md
 *
 * Content-Type detection (FR-014): if the generator-emitted Content-Type
 * starts with `application/x-www-form-urlencoded`, the body is passed
 * through as a `URLSearchParams` (already encoded by the generator). The
 * fetcher in `client.ts` handles `URLSearchParams` natively.
 */
import { apiFetchWithMeta, ApiError, type ApiRequest } from './client';

export type ErrorType<E> = ApiError & { body: E };
export type BodyType<B> = B;

// Orval's call shape. We accept a superset of RequestInit so future generator
// versions that add fields (signal, credentials, etc.) just pass through.
export interface MutatorInit extends Omit<RequestInit, 'body'> {
  body?: BodyInit | URLSearchParams | null;
}

export async function mutator<T>(url: string, init: MutatorInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();

  // Detect form-encoded bodies from the generator-emitted header.
  const headersRecord: Record<string, string> = {};
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => {
        headersRecord[k] = v;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [k, v] of init.headers) headersRecord[k] = v;
    } else {
      Object.assign(headersRecord, init.headers as Record<string, string>);
    }
  }
  const ct = (
    headersRecord['Content-Type'] ?? headersRecord['content-type'] ?? ''
  ).toLowerCase();
  const form = ct.startsWith('application/x-www-form-urlencoded');

  const request: ApiRequest = {
    method,
    headers: headersRecord,
    signal: init.signal ?? undefined,
    form,
  };

  if (init.body !== undefined) {
    // URLSearchParams or BodyInit — apiFetch accepts both. When `form` is
    // true, apiFetch leaves the body untouched if it's already a
    // URLSearchParams; otherwise it serializes JSON.
    request.body = init.body as ApiRequest['body'];
  }

  // ApiError thrown by apiFetchWithMeta passes through untouched — consumers
  // can still `e instanceof ApiError` to inspect status + body (FR-013, D-006).
  // (The explicit reference to ApiError below keeps the import live.)
  void ApiError;
  // Orval's generated types expect `{data, status, headers}` — return the
  // wrapped envelope so the runtime shape matches the declared discriminated
  // union (e.g., `authLoginResponseSuccess`).
  return (await apiFetchWithMeta(url, request)) as T;
}

export default mutator;

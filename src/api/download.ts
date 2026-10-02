/**
 * Shared authenticated file download (feature 036-orval-sdk-integration).
 *
 * This is the ONE sanctioned place that performs a raw `fetch` for binary /
 * streaming responses (Excel exports) — feature code MUST NOT call `fetch`
 * directly. Callers pass a **generated SDK URL builder** result as `path`
 * (e.g. `getAdminExportPaymentsUrl()`), plus an optional params object. Array
 * values become repeated query params (`uuids=a&uuids=b`), which the generated
 * URL builders do NOT do correctly for lists — so query serialization lives here.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export type DownloadParams = Record<
  string,
  string | number | boolean | Array<string | number> | null | undefined
>;

function buildQuery(params?: DownloadParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => usp.append(key, String(v)));
    else usp.append(key, String(value));
  }
  return usp.toString();
}

/**
 * Download a file via an authenticated GET → Blob → anchor click.
 * Returns `false` when the server reports nothing to export (HTTP 422),
 * `true` on success, and throws on other non-OK responses.
 */
export async function downloadFile(
  path: string,
  params?: DownloadParams,
  fallbackName = 'download',
): Promise<boolean> {
  const query = buildQuery(params);
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${query ? `${sep}${query}` : ''}`;

  const resp = await fetch(url, { method: 'GET', credentials: 'include' });
  if (resp.status === 422) return false; // nothing to export
  if (!resp.ok) throw new Error(`Download failed (${resp.status})`);

  const blob = await resp.blob();
  const disposition = resp.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
  return true;
}

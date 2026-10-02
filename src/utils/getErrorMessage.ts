// Structural error shape — matches both Axios's `AxiosError<T>` and the
// project's auth-stubs thrown shape. Avoids depending on `axios` as a
// type-only import.
type ApiError<T> = { response?: { data?: T } };

/**
 * Standard backend error envelope produced by:
 *   - core/exception_handler.py (raised DRF exceptions)
 *   - core/error_response.py    (manual error returns)
 *
 * Shape:
 *   {
 *     "error": {
 *       "message": "Human-readable string",
 *       "code": "MACHINE_READABLE_CODE",
 *       "details": { "field": ["..."] }   // optional
 *     }
 *   }
 */
type ApiErrorEnvelope = {
  error?:
    | {
        message?: string;
        code?: string;
        details?: Record<string, string[] | string> & {
          non_field_errors?: string[];
        };
      }
    | string;
  detail?: string;
  message?: string;
};

/**
 * Extract a user-facing error message from any API error.
 *
 * Handles:
 *  - The standard backend envelope: { error: { message, code, details } }
 *  - Field-level validation errors via details.non_field_errors or first field
 *  - Legacy/defensive shapes: string `error`, `detail`, `message`
 *  - Network errors / non-DRF 5xx (no response.data) → fallback
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const data = (error as ApiError<ApiErrorEnvelope>)?.response?.data;
  if (!data) return fallback;

  if (data.error && typeof data.error === 'object') {
    const { message, details } = data.error;
    if (message) return message;
    if (details?.non_field_errors?.[0]) return details.non_field_errors[0];

    // Fall back to the first field-level error, e.g. { email: ["already exists"] }
    const firstField = Object.values(details ?? {}).find(Boolean);
    if (Array.isArray(firstField) && firstField[0]) return firstField[0];
    if (typeof firstField === 'string') return firstField;
  }

  if (typeof data.error === 'string') return data.error;
  if (data.detail) return data.detail;
  if (data.message) return data.message;

  return fallback;
}

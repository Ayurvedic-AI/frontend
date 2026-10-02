import type { FieldValues, UseFormSetError } from 'react-hook-form'

// Structural error shape — matches both Axios's `AxiosError<T>` and our
// stub module's thrown shape. Avoids depending on `axios` as a type-only import.
type ApiError<T> = { response?: { data?: T } }

type ApiErrorDetails = Record<string, string[] | string> & {
  non_field_errors?: string[]
}

type ApiErrorEnvelope = {
  error?:
    | { message?: string; code?: string; details?: ApiErrorDetails }
    | string
  detail?: string
  message?: string
}

// Maps backend snake_case field names to form camelCase field names.
// Only fields in this map are set on the form; all others fall through to the snackbar.
const FIELD_NAME_MAP: Record<string, string> = {
  email: 'email',
  username: 'username',
  password: 'password',
  new_password: 'newPassword',
  confirm_password: 'confirmPassword',
}

const FALLBACK = 'Something went wrong. Please try again.'

/**
 * Parses a backend API error and routes errors to the appropriate destination:
 * - Field-level errors (from `error.details`) are set on the form via `setError`
 *   and displayed inline below each input by RHFInput.
 * - Non-field errors (general `message`, `non_field_errors`, network failures)
 *   are returned as a string for the caller to show in a snackbar.
 *
 * Returns `null` when all errors were field-level (no snackbar needed).
 *
 * NOTE: When the response contains both `details` (field errors) and a top-level
 * `message`, field errors take priority and `message` is intentionally discarded
 * to avoid showing both inline errors and a snackbar for the same submission.
 */
export function useFormApiErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
) {
  const handleApiError = (error: unknown): string | null => {
    // The generated SDK throws `ApiError` carrying `.body` = the parsed
    // response. FastAPI returns `{ detail: "msg" }` for domain errors and
    // `{ detail: [{ loc, msg }] }` for 422 validation. Without this branch
    // those messages were masked by the generic fallback (#28).
    const body = (error as { body?: unknown } | undefined)?.body
    if (body && typeof body === 'object') {
      const detail = (body as { detail?: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) {
        let firstMsg: string | null = null
        for (const item of detail) {
          const msg = (item as { msg?: unknown })?.msg
          if (typeof msg !== 'string') continue
          if (!firstMsg) firstMsg = msg
          const loc = (item as { loc?: unknown[] })?.loc
          const rawField = Array.isArray(loc) ? loc[loc.length - 1] : undefined
          if (typeof rawField === 'string') {
            const formField = FIELD_NAME_MAP[rawField] ?? rawField
            setError(formField as Parameters<UseFormSetError<T>>[0], { message: msg })
          }
        }
        return firstMsg ?? FALLBACK
      }
    }

    const data = (error as ApiError<ApiErrorEnvelope>)?.response?.data

    if (!data) return FALLBACK

    const { error: envelope, detail, message } = data

    if (!envelope) return detail ?? message ?? FALLBACK
    if (typeof envelope === 'string') return envelope

    const { details, message: envelopeMessage } = envelope

    if (details) {
      // non_field_errors is always a general error
      if (details.non_field_errors?.[0]) {
        return details.non_field_errors[0]
      }

      let hasFieldErrors = false
      let firstUnknownError: string | null = null

      for (const [backendField, value] of Object.entries(details)) {
        if (backendField === 'non_field_errors') continue

        const formField = FIELD_NAME_MAP[backendField]
        const msg = Array.isArray(value) ? value[0] : value

        if (!formField) {
          if (!firstUnknownError && typeof msg === 'string') {
            firstUnknownError = msg
          }
          continue
        }

        if (typeof msg === 'string') {
          setError(formField as Parameters<UseFormSetError<T>>[0], { message: msg })
          hasFieldErrors = true
        }
      }

      if (hasFieldErrors) return null
      if (firstUnknownError) return firstUnknownError
    }

    return envelopeMessage ?? FALLBACK
  }

  return { handleApiError }
}

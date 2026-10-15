import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) return msgs.join(' ')

  const status = error.status
  const data = error.response?.data
  const isDataEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0)
  if (
    status === 401 ||
    (status === 400 && isDataEmpty && error.message.includes('Failed to create record.'))
  ) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return error.message || 'An unexpected error occurred.'
}

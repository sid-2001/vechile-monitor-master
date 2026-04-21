export const API_ERROR_EVENT = 'app:api-error'

export const emitApiError = (message: string): void => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: { message } }))
}


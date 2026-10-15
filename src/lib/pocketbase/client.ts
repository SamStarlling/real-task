import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Interceptor global para capturar 401 ou 400 sem dados (reprovação de API rule por token expirado)
pb.afterSend = (response, data) => {
  try {
    const status = response.status
    const isDataEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0)
    const msg = String(data?.message || '')
    const hasAuth = !!pb.authStore.token

    if (
      hasAuth &&
      (status === 401 ||
        (status === 400 &&
          isDataEmpty &&
          (msg.includes('Failed to create record.') ||
            msg.includes('Failed to update record.') ||
            msg.includes('Failed to authenticate'))))
    ) {
      import('./auth-session')
        .then(({ invalidateSessionAndRedirect }) => {
          invalidateSessionAndRedirect()
        })
        .catch(() => {})
    }
  } catch {
    // Evita que falhas no interceptor interrompam a cadeia normal
  }
  return data
}

export default pb

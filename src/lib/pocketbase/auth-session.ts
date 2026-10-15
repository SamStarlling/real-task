import pb from './client'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.'

export interface ParsedJwtPayload {
  exp?: number
  id?: string
  collectionId?: string
  [key: string]: unknown
}

/**
 * Decodifica o payload de um JWT de forma segura (sem dependências externas).
 */
export function parseJwtPayload(token: string | null | undefined): ParsedJwtPayload | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const jsonStr = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonStr) as ParsedJwtPayload
  } catch {
    return null
  }
}

/**
 * Retorna o timestamp de expiração (em segundos) do token atual do authStore.
 */
export function getTokenExpiry(token = pb.authStore.token): number | null {
  const payload = parseJwtPayload(token)
  return typeof payload?.exp === 'number' ? payload.exp : null
}

/**
 * Verifica se o token já expirou ou expira dentro de uma margem de segurança (em segundos).
 */
export function isTokenExpired(
  token = pb.authStore.token,
  bufferSeconds = 0,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!token) return true
  const exp = getTokenExpiry(token)
  if (!exp) return false
  return exp <= nowSeconds + bufferSeconds
}

/**
 * Verifica se o token está próximo de expirar (por padrão dentro de 24 horas).
 */
export function isTokenNearExpiry(
  token = pb.authStore.token,
  bufferSeconds = 24 * 60 * 60, // 24 horas
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return isTokenExpired(token, bufferSeconds, nowSeconds)
}

export interface InvalidateSessionOptions {
  reason?: string
  redirectUrl?: string
}

let isHandlingExpiry = false

/**
 * Limpa o authStore e redireciona para o /login preservando a rota de retorno e aviso.
 */
export function invalidateSessionAndRedirect(options: InvalidateSessionOptions = {}) {
  const reason = options.reason || SESSION_EXPIRED_MESSAGE
  try {
    pb.authStore.clear()
  } catch (err) {
    console.warn('Erro ao limpar authStore:', err)
  }

  if (typeof window === 'undefined') return
  if (isHandlingExpiry) return
  isHandlingExpiry = true

  const currentPath =
    options.redirectUrl ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`

  // Salva no sessionStorage para que a tela de login apresente o aviso amigável
  try {
    sessionStorage.setItem('barbosa_auth_flash_message', reason)
  } catch {
    // ignora se cookies/storage bloqueados
  }

  const loginTarget =
    currentPath && !currentPath.startsWith('/login') && currentPath !== '/'
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : '/login'

  // Se já estamos no login, apenas avisa
  if (window.location.pathname === '/login') {
    isHandlingExpiry = false
    return
  }

  window.location.assign(loginTarget)
  setTimeout(() => {
    isHandlingExpiry = false
  }, 1000)
}

/**
 * Flag para evitar múltiplas chamadas concorrentes de authRefresh.
 */
let refreshPromise: Promise<boolean> | null = null

/**
 * Tenta renovar o token do usuário logado via pb.collection('users').authRefresh().
 * Se falhar por 400/401/token inválido, invalida a sessão e redireciona.
 */
export async function refreshAuthSession(): Promise<boolean> {
  if (!pb.authStore.token || !pb.authStore.record) {
    return false
  }

  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      await pb.collection('users').authRefresh()
      return true
    } catch (err: unknown) {
      console.warn('Falha ao renovar sessão (authRefresh):', err)
      invalidateSessionAndRedirect({ reason: SESSION_EXPIRED_MESSAGE })
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Verifica se um erro de resposta da API do PocketBase indica sessão expirada / não autorizada:
 * - HTTP 401
 * - HTTP 400 com body {"message": "Failed to create record."} e data vazio ({}), típico de falha de API rule por ausência de @request.auth.id válido
 */
export function isAuthSessionExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as {
    status?: number
    response?: { status?: number; message?: string; data?: unknown }
    message?: string
    data?: unknown
  }

  const status = Number(err.status || err.response?.status)
  if (status === 401) return true

  // PocketBase retorna status 400 com data vazio quando create rule reprova devido a auth token anônimo/inválido
  if (status === 400) {
    const rawData = err.response?.data !== undefined ? err.response.data : err.data
    const isDataEmpty =
      rawData === undefined ||
      rawData === null ||
      (typeof rawData === 'object' && Object.keys(rawData as object).length === 0)

    const rawMessage = String(err.response?.message || err.message || '')
    if (
      isDataEmpty &&
      (rawMessage.includes('Failed to create record.') ||
        rawMessage.includes('Failed to authenticate') ||
        rawMessage.includes('Failed to update record.') ||
        rawMessage.includes('Only authenticated requests can access this action'))
    ) {
      return true
    }
  }

  return false
}

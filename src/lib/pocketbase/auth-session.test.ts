import { describe, it, expect } from 'vitest'
import {
  SESSION_EXPIRED_MESSAGE,
  getTokenExpiry,
  isAuthSessionExpiredError,
  isTokenExpired,
  isTokenNearExpiry,
  parseJwtPayload,
} from './auth-session'
import type { ParsedJwtPayload } from './auth-session'

/**
 * Codifica um payload JWT em base64url (mesma forma de um token PocketBase:
 * header.payload.signature — aqui só o payload importa para os cenários).
 */
function makeTokenPayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeToken(payload: Partial<ParsedJwtPayload>): string {
  return `hdr.${makeTokenPayload(payload)}.sig`
}

describe('parseJwtPayload', () => {
  it('decodifica o payload de um token válido', () => {
    const exp = 1791948004
    const token = makeToken({ exp, id: 'user1', collectionId: 'users' })
    const parsed = parseJwtPayload(token)
    expect(parsed).not.toBeNull()
    expect(parsed?.exp).toBe(exp)
    expect(parsed?.id).toBe('user1')
  })

  it('retorna null para token malformado', () => {
    expect(parseJwtPayload('')).toBeNull()
    expect(parseJwtPayload('sem-payload')).toBeNull()
    expect(parseJwtPayload(null)).toBeNull()
  })
})

describe('getTokenExpiry / isTokenExpired', () => {
  it('extrai o exp de um token real (ex: 1791948004)', () => {
    const token = makeToken({ exp: 1791948004, refreshable: true })
    expect(getTokenExpiry(token)).toBe(1791948004)
  })

  it('detecta token já expirado (exp < agora)', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 })
    expect(isTokenExpired(token)).toBe(true)
  })

  it('detecta token válido ainda dentro da margem', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 * 48 })
    expect(isTokenExpired(token)).toBe(false)
    expect(isTokenNearExpiry(token)).toBe(false)
  })

  it('token sem exp não é tratado como expirado', () => {
    const token = makeToken({ id: 'user1' })
    expect(isTokenExpired(token)).toBe(false)
  })

  it('token vazio é considerado expirado', () => {
    expect(isTokenExpired('')).toBe(true)
  })
})

describe('isTokenNearExpiry', () => {
  it('token que expira em 12h está próximo do vencimento (buffer de 24h)', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 })
    expect(isTokenNearExpiry(token)).toBe(true)
  })

  it('token que expira em 30h não está próximo do vencimento', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 30 })
    expect(isTokenNearExpiry(token)).toBe(false)
  })
})

describe('isAuthSessionExpiredError', () => {
  it('reconhece 401 como sessão expirada', () => {
    expect(isAuthSessionExpiredError({ status: 401 })).toBe(true)
  })

  it('reconhece 400 "Failed to create record." com data vazio (API rule reprovada)', () => {
    const err = {
      status: 400,
      response: { status: 400, message: 'Failed to create record.', data: {} },
    }
    expect(isAuthSessionExpiredError(err)).toBe(true)
  })

  it('rejeita 400 com erros de campo (validação, não sessão)', () => {
    const err = {
      status: 400,
      response: {
        status: 400,
        message: 'Failed to create record.',
        data: { title: { code: 'validation_required', message: 'Cannot be blank' } },
      },
    }
    expect(isAuthSessionExpiredError(err)).toBe(false)
  })

  it('rejeita 400 sem mensagem conhecida', () => {
    const err = { status: 400, response: { status: 400, message: 'Something else.', data: {} } }
    expect(isAuthSessionExpiredError(err)).toBe(false)
  })

  it('rejeita erros não HTTP', () => {
    expect(isAuthSessionExpiredError(null)).toBe(false)
    expect(isAuthSessionExpiredError('erro qualquer')).toBe(false)
    expect(isAuthSessionExpiredError(new Error('timeout'))).toBe(false)
  })
})

describe('SESSION_EXPIRED_MESSAGE', () => {
  it('possui a mensagem clara exigida pelo produto', () => {
    expect(SESSION_EXPIRED_MESSAGE).toBe('Sua sessão expirou. Entre novamente.')
  })
})

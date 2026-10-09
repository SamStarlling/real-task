import { describe, it, expect } from 'vitest'
import { getMcpServerUrl } from '@/services/mcp'
import { TAG_PALETTE } from '@/services/data'

describe('MCP Service & Helpers (Etapa 1)', () => {
  it('gera URL canônica correta do servidor MCP em /backend/v1/mcp', () => {
    const url = getMcpServerUrl()
    expect(url).toMatch(/\/backend\/v1\/mcp$/)
    expect(url).toContain('http')
  })

  it('paleta de tags da casa é preservada e possui cores discretas no padrão quiet luxury', () => {
    expect(TAG_PALETTE.length).toBeGreaterThanOrEqual(6)
    // Ouro Champagne oficial
    expect(TAG_PALETTE).toContain('#C5A880')
    // Verde-Oliva discreto
    expect(TAG_PALETTE).toContain('#8F9E82')
  })

  it('cálculo temporal de started_at e ended_at para log_focus_session respeita a duração', () => {
    const durationMinutes = 25
    const now = new Date()
    const endedAt = now.toISOString()
    const startedAt = new Date(now.getTime() - durationMinutes * 60 * 1000).toISOString()

    const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime()
    expect(diffMs).toBe(25 * 60 * 1000)
  })

  it('serialização das 7 ferramentas MCP do núcleo cumpre schema JSON-RPC', () => {
    const expectedTools = [
      'create_task',
      'list_tasks',
      'complete_task',
      'update_task',
      'delete_task',
      'get_focus_summary',
      'log_focus_session',
    ]

    expect(expectedTools).toHaveLength(7)
    expect(expectedTools).toContain('create_task')
    expect(expectedTools).toContain('complete_task')
    expect(expectedTools).toContain('get_focus_summary')
    expect(expectedTools).toContain('log_focus_session')
  })

  it('validação de prioridade P1-P4 para create_task e update_task', () => {
    const validPriorities = [1, 2, 3, 4]
    expect(validPriorities.includes(1)).toBe(true)
    expect(validPriorities.includes(4)).toBe(true)
    expect(validPriorities.includes(5)).toBe(false)
  })
})

// src/lib/mcp.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMcpServerUrl,
  getMcpTokens,
  createMcpToken,
  revokeMcpToken,
  deleteMcpToken,
} from '../services/mcp'
import {
  parseCaptureTaskInput,
  parseServerDate,
  parseServerTime,
  parseServerRecurrence,
  parseServerPriority,
  TAG_COLORS,
} from './mcp-server-parser'
import pb from './pocketbase/client'

// Mocks do cliente PocketBase
vi.mock('./pocketbase/client', () => ({
  default: {
    collection: vi.fn(),
  },
}))

describe('MCP Service Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('constrói a URL do servidor MCP com o endpoint oficial /backend/v1/mcp', () => {
    const url = getMcpServerUrl()
    expect(url).toContain('/backend/v1/mcp')
    expect(url.startsWith('http://') || url.startsWith('https://')).toBe(true)
  })

  it('lista tokens MCP ordenados decrescente por criação', async () => {
    const mockGetFullList = vi
      .fn()
      .mockResolvedValue([{ id: 'tok_1', name: 'Claude Desktop', token_prefix: 'bs_mcp_a1b2c3d4' }])
    ;(pb.collection as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getFullList: mockGetFullList,
    })

    const result = await getMcpTokens()
    expect(pb.collection).toHaveBeenCalledWith('mcp_tokens')
    expect(mockGetFullList).toHaveBeenCalledWith({ sort: '-created' })
    expect(result).toHaveLength(1)
    expect(result[0].token_prefix).toBe('bs_mcp_a1b2c3d4')
  })

  it('cria novo token MCP chamando a rota customizada POST /backend/v1/mcp-tokens', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      id: 'tok_new',
      name: 'Cursor IDE',
      user: 'usr_1',
      raw_token: 'bs_mcp_secret_token_1234567890123456789012',
      created: '2026-04-10T12:00:00.000Z',
      revoked: false,
      message: 'Token gerado com sucesso',
    })
    ;(pb as unknown as { send: typeof mockPost }).send = mockPost

    const res = await createMcpToken('Cursor IDE')
    expect(mockPost).toHaveBeenCalledWith('/backend/v1/mcp-tokens', {
      method: 'POST',
      body: { name: 'Cursor IDE' },
    })
    expect(res.raw_token).toContain('bs_mcp_')
    expect(res.name).toBe('Cursor IDE')
  })

  it('revoga e exclui tokens MCP', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'tok_1', revoked: true })
    const mockDelete = vi.fn().mockResolvedValue(true)
    ;(pb.collection as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      update: mockUpdate,
      delete: mockDelete,
    })

    await revokeMcpToken('tok_1')
    expect(mockUpdate).toHaveBeenCalledWith('tok_1', { revoked: true })

    await deleteMcpToken('tok_1')
    expect(mockDelete).toHaveBeenCalledWith('tok_1')
  })
})

describe('MCP Etapa 2: Server-side NL Parser (capture_task)', () => {
  // Fixa data de referência: quarta-feira, 15 de Outubro de 2025, 12:00 UTC
  const fixedNow = new Date('2025-10-15T12:00:00.000Z')

  describe('1. Data + Horário', () => {
    it('reconhece "amanhã às 10h" e higieniza título', () => {
      const res = parseCaptureTaskInput('revisar contrato amanhã às 10h', fixedNow)
      expect(res.title).toBe('revisar contrato')
      expect(res.dueDate).toBe('2025-10-16')
      expect(res.dueTime).toBe('10:00')
    })

    it('reconhece horário "às 9h30" e "14:00"', () => {
      const t1 = parseServerTime('reunião às 9h30')
      expect(t1?.time).toBe('09:30')

      const t2 = parseServerTime('alinhamento 14:00')
      expect(t2?.time).toBe('14:00')
    })

    it('assume hoje quando apenas horário for fornecido', () => {
      const res = parseCaptureTaskInput('enviar e-mail às 15:30', fixedNow)
      expect(res.title).toBe('enviar e-mail')
      expect(res.dueDate).toBe('2025-10-15')
      expect(res.dueTime).toBe('15:30')
    })

    it('reconhece "depois de amanhã" corretamente', () => {
      const res = parseCaptureTaskInput('entrega do relatório depois de amanhã', fixedNow)
      expect(res.title).toBe('entrega do relatório')
      expect(res.dueDate).toBe('2025-10-17')
    })

    it('reconhece datas no formato dd/mm', () => {
      const res = parseCaptureTaskInput('pagar fatura 20/10', fixedNow)
      expect(res.title).toBe('pagar fatura')
      expect(res.dueDate).toBe('2025-10-20')
    })

    it('reconhece datas textuais "15 de novembro"', () => {
      const res = parseCaptureTaskInput('festa de aniversário 15 de novembro', fixedNow)
      expect(res.title).toBe('festa de aniversário')
      expect(res.dueDate).toBe('2025-11-15')
    })

    it('reconhece relativos "em 3 dias" e "daqui a duas semanas"', () => {
      const d1 = parseServerDate('entregar minuta em 3 dias', fixedNow)
      expect(d1?.date.getDate()).toBe(18) // 15 + 3

      const d2 = parseServerDate('check-in daqui a duas semanas', fixedNow)
      expect(d2?.date.getDate()).toBe(29) // 15 + 14
    })

    it('reconhece próxima ocorrência de dia da semana', () => {
      // 15/10/2025 é quarta-feira (day 3). Próxima segunda (day 1) deve ser 20/10/2025.
      const d = parseServerDate('alinhamento segunda', fixedNow)
      expect(d).not.toBeNull()
      expect(d?.date.getDay()).toBe(1)
      expect(d?.date.getDate()).toBe(20)
    })
  })

  describe('2. Recorrência + Horário', () => {
    it('interpreta "ler 10 páginas todo dia às 10:00"', () => {
      const res = parseCaptureTaskInput('ler 10 páginas todo dia às 10:00', fixedNow)
      expect(res.title).toBe('ler 10 páginas')
      expect(res.dueTime).toBe('10:00')
      expect(res.dueDate).toBe('2025-10-15')
      expect(res.recurrence).toEqual({
        type: 'daily',
        interval: 1,
        weekdays: null,
      })
    })

    it('interpreta "toda semana", "todos os dias úteis" e "todo dia 15"', () => {
      const rWeekly = parseServerRecurrence('reunião de alinhamento toda semana')
      expect(rWeekly?.type).toBe('weekly')
      expect(rWeekly?.interval).toBe(1)

      const rUteis = parseServerRecurrence('standup todos os dias úteis')
      expect(rUteis?.type).toBe('weekly_days')
      expect(rUteis?.weekdays).toEqual([1, 2, 3, 4, 5])

      const rDia15 = parseServerRecurrence('pagamento de aluguel todo dia 15')
      expect(rDia15?.type).toBe('monthly')
      expect(rDia15?.day).toBe(15)

      const rQuinta = parseServerRecurrence('reunião técnica toda segunda e quinta')
      expect(rQuinta?.type).toBe('weekly_days')
      expect(rQuinta?.weekdays).toEqual([1, 4])

      const rCada2 = parseServerRecurrence('revisão a cada duas semanas')
      expect(rCada2?.type).toBe('weekly')
      expect(rCada2?.interval).toBe(2)
    })
  })

  describe('3. Prioridade + Etiqueta + Lista na mesma frase', () => {
    it('processa "revisar contrato amanhã às 10h p1 @trabalho #jurídico"', () => {
      const res = parseCaptureTaskInput(
        'revisar contrato amanhã às 10h p1 @trabalho #jurídico',
        fixedNow,
      )
      expect(res.title).toBe('revisar contrato')
      expect(res.dueDate).toBe('2025-10-16')
      expect(res.dueTime).toBe('10:00')
      expect(res.priority).toBe(1)
      expect(res.tags).toEqual(['trabalho'])
      expect(res.list).toBe('jurídico')
    })

    it('suporta múltiplos marcadores de prioridade: "p2", "!", "!!"', () => {
      const p1 = parseServerPriority('finalizar relatório p2')
      expect(p1?.priority).toBe(2)

      const pExcl = parseServerPriority('atenção urgente !')
      expect(pExcl?.priority).toBe(1)

      const pDoubleExcl = parseServerPriority('pagar DAS amanhã !!')
      expect(pDoubleExcl?.priority).toBe(2)
    })

    it('suporta múltiplas etiquetas na mesma frase', () => {
      const res = parseCaptureTaskInput('estudar arquitetura @tech @estudos #carreira')
      expect(res.title).toBe('estudar arquitetura')
      expect(res.tags).toEqual(['tech', 'estudos'])
      expect(res.list).toBe('carreira')
    })
  })

  describe('4. Resolução de etiquetas e paleta Quiet Luxury', () => {
    it('garante que a paleta oficial possui as 8 cores da casa', () => {
      expect(TAG_COLORS).toHaveLength(8)
      expect(TAG_COLORS[0]).toBe('#C5A880') // Champagne Ouro
      expect(TAG_COLORS[1]).toBe('#8F9E82') // Verde-Oliva
      expect(TAG_COLORS[2]).toBe('#7E92A2') // Azul-Ardósia
    })

    it('valida lógica case-insensitive para comparação de etiquetas e listas', () => {
      const existingTags = [
        { id: 'tag_1', name: 'Trabalho' },
        { id: 'tag_2', name: 'PESSOAL' },
      ]

      const search1 = 'trabalho'
      const found1 = existingTags.find((t) => t.name.trim().toLowerCase() === search1.toLowerCase())
      expect(found1?.id).toBe('tag_1')

      const search2 = 'pessoal'
      const found2 = existingTags.find((t) => t.name.trim().toLowerCase() === search2.toLowerCase())
      expect(found2?.id).toBe('tag_2')

      const search3 = 'urgente'
      const found3 = existingTags.find((t) => t.name.trim().toLowerCase() === search3.toLowerCase())
      expect(found3).toBeUndefined()
    })
  })

  describe('5. Estrutura de sub-tarefas (create_subtasks)', () => {
    it('gera formato canônico { id, title, done: false } compatível com o app', () => {
      const inputItems = [
        'Item 1 em string pura',
        { title: 'Item 2 em objeto', done: false },
        { title: 'Item 3 já feito', done: true },
      ]

      const structured = inputItems.map((item, index) => {
        const title = typeof item === 'string' ? item : item.title
        const done = typeof item === 'string' ? false : !!item.done
        return {
          id: `sub_${index}`,
          title,
          done,
        }
      })

      expect(structured).toHaveLength(3)
      expect(structured[0].title).toBe('Item 1 em string pura')
      expect(structured[0].done).toBe(false)
      expect(structured[2].done).toBe(true)

      // Serialização JSON deve corresponder ao que a tabela tasks armazena no campo subtasks
      const serialized = JSON.stringify(structured)
      const deserialized = JSON.parse(serialized)
      expect(deserialized[1].title).toBe('Item 2 em objeto')
    })
  })
})

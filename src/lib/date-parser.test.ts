import {
  parsePortugueseDate,
  parsePortugueseTime,
  parsePortugueseRecurrence,
  cleanDateToken,
  cleanTimeToken,
  cleanRecurrenceToken,
} from './date-parser'
import {
  parsePriorityToken,
  cleanPriorityToken,
  getSubtaskProgress,
  resetSubtasksForRecurrence,
} from '@/services/data'
import { computeBestDayStats } from './best-day'
import type { SubtaskItem, SessionRecord } from '@/types'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`)
  }
}

function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(
      `TEST FAILED: ${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`,
    )
  }
}

export function runDateParserTests() {
  // Fixar data base de teste: Quarta-feira, 15 de Outubro de 2025 às 12:00
  const fixedNow = new Date(2025, 9, 15, 12, 0, 0) // Month 9 = Outubro

  // --- 1. RECORRÊNCIA ---
  // 1.1 "Ler 10 páginas todo dia às 10:00"
  {
    const text = 'Ler 10 páginas todo dia às 10:00'
    const rec = parsePortugueseRecurrence(text)
    assert(rec !== null, 'Deveria reconhecer "todo dia"')
    assertEquals(rec?.type, 'daily', 'Tipo de "todo dia" deve ser daily')
    assertEquals(rec?.interval, 1, 'Intervalo deve ser 1')

    const time = parsePortugueseTime(text)
    assert(time !== null, 'Deveria reconhecer "às 10:00"')
    assertEquals(time?.time, '10:00', 'Horário deve ser 10:00')

    let cleaned = cleanRecurrenceToken(text, rec)
    cleaned = cleanTimeToken(cleaned, time)
    assertEquals(cleaned, 'Ler 10 páginas', 'Título final limpo sem recorrência e sem horário')
  }

  // 1.2 "todo dia 15" -> mensal no dia 15, não diária!
  {
    const text = 'Pagar aluguel todo dia 15'
    const rec = parsePortugueseRecurrence(text)
    assert(rec !== null, 'Deveria reconhecer "todo dia 15"')
    assertEquals(rec?.type, 'monthly', '"todo dia 15" deve ser mensal')
    const cleaned = cleanRecurrenceToken(text, rec)
    assertEquals(cleaned, 'Pagar aluguel', 'Título deve ser "Pagar aluguel"')
  }

  // 1.3 "toda semana" -> semanal
  {
    const text = 'Revisão geral toda semana'
    const rec = parsePortugueseRecurrence(text)
    assert(rec !== null, 'Deveria reconhecer "toda semana"')
    assertEquals(rec?.type, 'weekly', 'Tipo deve ser weekly')
    assertEquals(rec?.interval, 1, 'Intervalo 1')
    assertEquals(cleanRecurrenceToken(text, rec), 'Revisão geral', 'Limpa token')
  }

  // 1.4 "toda segunda" -> weekly_days com [1]
  {
    const text = 'Planejamento semanal toda segunda às 09:00'
    const rec = parsePortugueseRecurrence(text)
    assert(rec !== null, 'Deveria reconhecer "toda segunda"')
    assertEquals(rec?.type, 'weekly_days', 'Tipo semanal com dia')
    assert(Array.isArray(rec?.weekdays) && rec?.weekdays?.includes(1), 'Dia 1 (segunda)')

    const time = parsePortugueseTime(text)
    assertEquals(time?.time, '09:00', 'Horário 09:00')

    let cleaned = cleanRecurrenceToken(text, rec)
    cleaned = cleanTimeToken(cleaned, time)
    assertEquals(cleaned, 'Planejamento semanal', 'Título limpo')
  }

  // 1.5 "toda terça-feira" e combinações "toda terca e quinta"
  {
    const text = 'Academia toda terca e quinta'
    const rec = parsePortugueseRecurrence(text)
    assert(rec !== null, 'Deveria reconhecer "toda terca e quinta"')
    assertEquals(rec?.type, 'weekly_days', 'weekly_days')
    assert(
      rec?.weekdays?.includes(2) && rec?.weekdays?.includes(4),
      'Inclui terça (2) e quinta (4)',
    )
  }

  // 1.6 "a cada 3 dias"
  {
    const text = 'Regar plantas a cada 3 dias'
    const rec = parsePortugueseRecurrence(text)
    assert(rec !== null, 'Deveria reconhecer "a cada 3 dias"')
    assertEquals(rec?.type, 'daily', 'daily')
    assertEquals(rec?.interval, 3, 'interval 3')
    assertEquals(cleanRecurrenceToken(text, rec), 'Regar plantas', 'Título limpo')
  }

  // --- 2. DATAS FUTURAS EXPLÍCITAS E RELATIVAS ---
  // 2.1 "reunião 12/11" (formato dd/mm)
  {
    const text = 'reunião 12/11'
    const parsed = parsePortugueseDate(text, fixedNow)
    assert(parsed !== null, 'Deveria reconhecer "12/11"')
    assertEquals(parsed?.date.getDate(), 12, 'Dia 12')
    assertEquals(parsed?.date.getMonth(), 10, 'Mês Novembro (10)')
    assertEquals(parsed?.date.getFullYear(), 2025, 'Ano 2025')
    assertEquals(cleanDateToken(text, parsed), 'reunião', 'Título limpo sem data')
  }

  // 2.2 "entregar relatório 15 de novembro"
  {
    const text = 'entregar relatório 15 de novembro'
    const parsed = parsePortugueseDate(text, fixedNow)
    assert(parsed !== null, 'Deveria reconhecer "15 de novembro"')
    assertEquals(parsed?.date.getDate(), 15, 'Dia 15')
    assertEquals(parsed?.date.getMonth(), 10, 'Mês Novembro (10)')
    assertEquals(cleanDateToken(text, parsed), 'entregar relatório', 'Título limpo')
  }

  // 2.3 Relativos: "em 3 dias"
  {
    const text = 'Finalizar artigo em 3 dias'
    const parsed = parsePortugueseDate(text, fixedNow)
    assert(parsed !== null, 'Deveria reconhecer "em 3 dias"')
    assertEquals(parsed?.date.getDate(), 18, 'Dia 15 + 3 = 18')
    assertEquals(cleanDateToken(text, parsed), 'Finalizar artigo', 'Título limpo')
  }

  // 2.4 Relativos com palavras: "daqui a duas semanas"
  {
    const text = 'Apresentação diretoria daqui a duas semanas'
    const parsed = parsePortugueseDate(text, fixedNow)
    assert(parsed !== null, 'Deveria reconhecer "daqui a duas semanas"')
    assertEquals(parsed?.date.getDate(), 29, 'Dia 15 + 14 = 29')
    assertEquals(cleanDateToken(text, parsed), 'Apresentação diretoria', 'Título limpo')
  }

  // 2.5 "próxima segunda" -> DEVE pular para a segunda-feira seguinte (semana que vem), NUNCA a atual
  {
    // fixedNow = 15/10/2025 (quarta-feira, day=3)
    // segunda atual da semana foi 13/10/2025. Próxima segunda deve ser 20/10/2025 (+12 dias do início da semana, +5 dias de quarta)
    // Se fosse quinta (16/10), "próxima segunda" também deve ser 20/10/2025 ou posterior (semana seguinte)
    const text = 'Alinhar sprint próxima segunda'
    const parsed = parsePortugueseDate(text, fixedNow)
    assert(parsed !== null, 'Deveria reconhecer "próxima segunda"')
    assertEquals(parsed?.date.getDay(), 1, 'Deve ser segunda-feira (day 1)')
    // Deve ser maior que fixedNow + 7 se for segunda ou cair estritamente na próxima semana
    assert(parsed!.date.getTime() > fixedNow.getTime(), 'Data deve ser no futuro')
    assertEquals(parsed?.date.getDate(), 20, '15/10 (qua) -> próxima segunda = 20/10/2025')
    assertEquals(cleanDateToken(text, parsed), 'Alinhar sprint', 'Título limpo')
  }

  // 2.6 Combinável com horário: "dentista 20/11 às 9h30"
  {
    const text = 'dentista 20/11 às 9h30'
    const parsedDate = parsePortugueseDate(text, fixedNow)
    const parsedTime = parsePortugueseTime(text)
    assert(parsedDate !== null, 'Deveria reconhecer 20/11')
    assert(parsedTime !== null, 'Deveria reconhecer às 9h30')
    assertEquals(parsedDate?.date.getDate(), 20, 'Dia 20')
    assertEquals(parsedDate?.date.getMonth(), 10, 'Novembro')
    assertEquals(parsedTime?.time, '09:30', 'Horário 09:30')
    let cleaned = cleanDateToken(text, parsedDate)
    cleaned = cleanTimeToken(cleaned, parsedTime)
    assertEquals(cleaned, 'dentista', 'Título final apenas "dentista"')
  }

  // --- 3. COMBINAÇÃO TOTAL: Recorrência + Horário + Prioridade + Tag + Lista ---
  {
    const text = 'Treino de perna todo dia às 7h p1 @saude #academia'
    const rec = parsePortugueseRecurrence(text)
    const time = parsePortugueseTime(text)
    const prio = parsePriorityToken(text)

    assert(rec !== null, 'Recorrência identificada')
    assertEquals(rec?.type, 'daily', 'Daily')
    assert(time !== null, 'Horário identificado')
    assertEquals(time?.time, '07:00', '07:00')
    assert(prio !== null, 'Prioridade identificada')
    assertEquals(prio?.priority, 1, 'P1')

    let cleaned = cleanRecurrenceToken(text, rec)
    cleaned = cleanTimeToken(cleaned, time)
    cleaned = cleanPriorityToken(cleaned, prio!.token)
    cleaned = cleaned.replace(/(?:^|\s)p[1-4](?=\s|$)/gi, ' ')
    cleaned = cleaned.replace(/(?:^|\s)#[^\s]+/g, '')
    cleaned = cleaned.replace(/(?:^|\s)@[^\s]+/g, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    assertEquals(cleaned, 'Treino de perna', 'Título completamente higienizado')
  }

  // --- 4. Exclamações para prioridade: "Revisar contrato !!" -> P2 ---
  {
    const text = 'Revisar contrato !!'
    const prio = parsePriorityToken(text)
    assert(prio !== null, 'Prioridade via !')
    assertEquals(prio?.priority, 2, '!! deve ser P2')
    assertEquals(cleanPriorityToken(text, prio!.token), 'Revisar contrato', 'Limpa !!')
  }

  // --- 5. SUB-TAREFAS & CHECKLIST (TickTick / Todoist) ---
  // 5.1 Cálculo de progresso de sub-tarefas
  {
    const emptyProgress = getSubtaskProgress(null)
    assertEquals(emptyProgress.total, 0, 'Total vazio deve ser 0')
    assertEquals(emptyProgress.completed, 0, 'Completas vazio deve ser 0')
    assertEquals(emptyProgress.allDone, false, 'allDone deve ser falso se vazio')

    const items: SubtaskItem[] = [
      { id: '1', title: 'Comprar pó de café', done: true },
      { id: '2', title: 'Limpar moedor', done: false },
      { id: '3', title: 'Ferver água a 92°C', done: true },
    ]
    const p = getSubtaskProgress(items)
    assertEquals(p.total, 3, 'Total 3 sub-tarefas')
    assertEquals(p.completed, 2, '2 sub-tarefas feitas')
    assertEquals(p.allDone, false, 'Nem todas concluídas')
    assertEquals(Math.round(p.ratio), 67, 'Ratio ~67%')

    const allDoneItems: SubtaskItem[] = [
      { id: '1', title: 'Passo 1', done: true },
      { id: '2', title: 'Passo 2', done: true },
    ]
    const pAll = getSubtaskProgress(allDoneItems)
    assertEquals(pAll.allDone, true, 'Todas concluídas deve ser true')
    assertEquals(pAll.ratio, 100, 'Ratio deve ser 100%')
  }

  // 5.2 Herança de sub-tarefas em tarefas recorrentes
  {
    const originalSubtasks: SubtaskItem[] = [
      { id: 'a1', title: 'Revisar extrato bancário', done: true },
      { id: 'a2', title: 'Categorizar lançamentos', done: true },
      { id: 'a3', title: 'Exportar relatório mensal', done: false },
    ]

    const inherited = resetSubtasksForRecurrence(originalSubtasks)
    assertEquals(inherited.length, 3, 'Mesma quantidade herdada')
    assertEquals(inherited[0].title, 'Revisar extrato bancário', 'Título preservado')
    assertEquals(inherited[0].done, false, 'Resetado para false')
    assertEquals(inherited[1].done, false, 'Resetado para false')
    assertEquals(inherited[2].done, false, 'Mantido false')
    assertEquals(inherited[0].id, 'a1', 'ID preservado')
  }

  // 6. Testes do cálculo de Melhor Dia & Recordes
  {
    const ref = new Date('2025-05-15T12:00:00') // Uma quinta-feira
    const makeSession = (
      id: string,
      started_at: string,
      ended_at: string,
      duration_minutes: number,
      session_date: string,
    ): SessionRecord => ({
      id,
      collectionId: 'sessions_col',
      collectionName: 'sessions',
      user: 'u1',
      task: 't1',
      started_at,
      ended_at,
      duration_minutes,
      session_date,
      status: 'completa',
      created: session_date.slice(0, 10),
      updated: session_date.slice(0, 10),
    })

    const mockSessions: SessionRecord[] = [
      makeSession(
        's1',
        '2025-05-10T10:00:00.000Z',
        '2025-05-10T12:00:00.000Z',
        120,
        '2025-05-10T00:00:00.000Z',
      ),
      makeSession(
        's2',
        '2025-05-10T14:00:00.000Z',
        '2025-05-10T15:30:00.000Z',
        90,
        '2025-05-10T00:00:00.000Z',
      ),
      makeSession(
        's3',
        '2025-05-15T09:00:00.000Z',
        '2025-05-15T10:30:00.000Z',
        90,
        '2025-05-15T00:00:00.000Z',
      ),
    ]

    const stats = computeBestDayStats(mockSessions, ref)
    assertEquals(stats.bestDay?.dateStr, '2025-05-10', 'Melhor dia absoluto foi 10 de maio')
    assertEquals(stats.bestDay?.totalMinutes, 210, 'Total do melhor dia 210 min')
    assertEquals(stats.isTodayRecord, false, 'Hoje não é o recorde ainda')
    assertEquals(stats.minutesRemainingToBeat, 120, 'Faltam 120 min para igualar o recorde')

    // Se hoje supera o recorde com 240 min
    const sessionsWithNewRecord: SessionRecord[] = [
      ...mockSessions,
      makeSession(
        's4',
        '2025-05-15T13:00:00.000Z',
        '2025-05-15T15:30:00.000Z',
        150,
        '2025-05-15T00:00:00.000Z',
      ),
    ]

    const statsNewRecord = computeBestDayStats(sessionsWithNewRecord, ref)
    assertEquals(statsNewRecord.todayMinutes, 240, 'Hoje soma 240 min')
    assertEquals(statsNewRecord.isTodayRecord, true, 'Hoje é o novo recorde')
    assertEquals(statsNewRecord.minutesRemainingToBeat, 0, 'Déficit zero quando é recorde')
  }

  return true
}

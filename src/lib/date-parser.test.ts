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
  sortPrioritizedItems,
  getTaskBig3Source,
  compareBig3Tasks,
  selectBig3ForDay,
} from '@/services/data'
import { computeBestDayStats } from './best-day'
import { computeWeeklyReport, getMondayOfIsoWeek } from './weekly-report'
import type { SubtaskItem, SessionRecord, TaskRecord, TagRecord, ListRecord } from '@/types'

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

  // 7. Testes de Priorização 80/20 e Ordenação de Etiquetas & Listas
  {
    const sampleItems = [
      { id: '1', name: 'Tarefas Gerais', order: 30, pinned: false },
      { id: '2', name: 'Big3 Metodologia', order: 20, pinned: true },
      { id: '3', name: 'Foco Profundo', order: 10, pinned: true },
      { id: '4', name: 'Arquivadas', order: 10, pinned: false },
      { id: '5', name: 'Estudos', order: 20, pinned: false },
    ]

    const sorted = sortPrioritizedItems(sampleItems)

    // Os itens pinned (prioritários) devem vir obrigatoriamente primeiro
    assertEquals(sorted[0].pinned, true, 'Primeiro item é prioritário (pinned)')
    assertEquals(sorted[1].pinned, true, 'Segundo item é prioritário (pinned)')
    assertEquals(sorted[0].name, 'Foco Profundo', 'Pinned com menor order (10) vem antes')
    assertEquals(sorted[1].name, 'Big3 Metodologia', 'Big3 (order 20, pinned) vem no topo')

    // Os itens não-pinned seguem ordenados por order crescente
    assertEquals(sorted[2].pinned, false, 'Terceiro item é não-prioritário')
    assertEquals(sorted[2].name, 'Arquivadas', 'Ordem 10 não-pinned')
    assertEquals(sorted[3].name, 'Estudos', 'Ordem 20 não-pinned')
    assertEquals(sorted[4].name, 'Tarefas Gerais', 'Ordem 30 não-pinned')
  }

  // 8. Testes do Efeito Big3 (Etapa 2): identificação de fonte prioritária, ordenação e seleção dos top 3
  {
    const sampleTags: TagRecord[] = [
      {
        id: 'tag-deep',
        name: 'Foco Profundo',
        color: '#C5A880',
        order: 10,
        pinned: true,
        user: 'u1',
        collectionId: 'tags_col',
        collectionName: 'tags',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
      {
        id: 'tag-study',
        name: 'Estudos',
        color: '#7E92A2',
        order: 20,
        pinned: true,
        user: 'u1',
        collectionId: 'tags_col',
        collectionName: 'tags',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
      {
        id: 'tag-routine',
        name: 'Rotina',
        color: '#8F9E82',
        order: 5,
        pinned: false,
        user: 'u1',
        collectionId: 'tags_col',
        collectionName: 'tags',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
    ]

    const sampleLists: ListRecord[] = [
      {
        id: 'list-proj-a',
        name: 'Projeto A',
        order: 15,
        pinned: true,
        user: 'u1',
        collectionId: 'lists_col',
        collectionName: 'lists',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
      {
        id: 'list-inbox',
        name: 'Geral',
        order: 5,
        pinned: false,
        user: 'u1',
        collectionId: 'lists_col',
        collectionName: 'lists',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
    ]

    const makeTask = (id: string, title: string, opts: Partial<TaskRecord> = {}): TaskRecord => ({
      id,
      title,
      user: 'u1',
      done: false,
      estimated_minutes: 25,
      actual_minutes: 0,
      collectionId: 'tasks_col',
      collectionName: 'tasks',
      created: '2025-10-15T10:00:00.000Z',
      updated: '2025-10-15T10:00:00.000Z',
      due_date: '2025-10-15T12:00:00.000Z',
      ...opts,
    })

    // 8.1 Tarefa sem tag/lista prioritária não tem fonte Big3
    const regularTask = makeTask('t1', 'Comprar água', {
      tags: ['tag-routine'],
      list: 'list-inbox',
    })
    assertEquals(
      getTaskBig3Source(regularTask, sampleTags, sampleLists),
      null,
      'Tarefa sem tags/listas pinned não deve ter fonte Big3',
    )

    // 8.2 Tarefa com tag prioritária
    const tagTask = makeTask('t2', 'Escrever relatório', {
      tags: ['tag-deep'],
    })
    const sourceT2 = getTaskBig3Source(tagTask, sampleTags, sampleLists)
    assert(sourceT2 !== null, 'Deve encontrar fonte prioritária para t2')
    assertEquals(sourceT2?.type, 'tag', 'Tipo deve ser tag')
    assertEquals(sourceT2?.name, 'Foco Profundo', 'Nome da tag deve ser Foco Profundo')
    assertEquals(sourceT2?.label, '@Foco Profundo', 'Label deve ser @Foco Profundo')

    // 8.3 Tarefa com MÚLTIPLAS origens prioritárias: deve escolher a de MAIOR prioridade (menor order)
    // tag-deep tem order 10, list-proj-a tem order 15, tag-study tem order 20
    const multiTask = makeTask('t3', 'Arquitetura do sistema', {
      tags: ['tag-study', 'tag-deep'],
      list: 'list-proj-a',
    })
    const sourceMulti = getTaskBig3Source(multiTask, sampleTags, sampleLists)
    assert(sourceMulti !== null, 'Deve encontrar fonte para tarefa múltipla')
    assertEquals(
      sourceMulti?.name,
      'Foco Profundo',
      'Deve escolher Foco Profundo por ter menor order (10)',
    )
    assertEquals(sourceMulti?.order, 10, 'Ordem do pai deve ser 10')

    // 8.4 Seleção de Big3 do dia com limite de 3 tarefas e desempate por P1-P4
    const tPrio1 = makeTask('p1', 'Definir escopo', {
      tags: ['tag-deep'], // order pai = 10
      priority: 2, // P2
      due_time: '14:00',
    })
    const tPrio2 = makeTask('p2', 'Revisar PR crítico', {
      tags: ['tag-deep'], // order pai = 10
      priority: 1, // P1 -> deve desempate antes de tPrio1!
      due_time: '15:00',
    })
    const tPrio3 = makeTask('p3', 'Alinhamento com cliente', {
      list: 'list-proj-a', // order pai = 15
      priority: 1,
    })
    const tPrio4 = makeTask('p4', 'Leitura técnica', {
      tags: ['tag-study'], // order pai = 20
      priority: 1,
    })

    const allDayTasks = [regularTask, tPrio1, tPrio2, tPrio3, tPrio4]
    const selection = selectBig3ForDay(allDayTasks, sampleTags, sampleLists, '2025-10-15')

    assertEquals(selection.totalCount, 4, 'Total de 4 tarefas prioritárias hoje')
    assertEquals(selection.top3.length, 3, 'Top 3 deve ter exatamente 3 tarefas')
    assertEquals(selection.remainingCount, 1, '1 tarefa excedente')
    assertEquals(selection.isCompleted, false, 'Ainda não está completo')

    // Ordem no top 3:
    // 1º: tPrio2 (pai order 10, P1)
    // 2º: tPrio1 (pai order 10, P2)
    // 3º: tPrio3 (pai order 15, P1)
    // Fora do top 3 (4º): tPrio4 (pai order 20)
    assertEquals(selection.top3[0].id, 'p2', 'Primeiro deve ser p2 (Pai 10, P1)')
    assertEquals(selection.top3[1].id, 'p1', 'Segundo deve ser p1 (Pai 10, P2)')
    assertEquals(selection.top3[2].id, 'p3', 'Terceiro deve ser p3 (Pai 15, P1)')

    // 8.5 Conclusão das 3 tarefas ativa o estado isCompleted
    const completedTasks = [
      { ...tPrio2, done: true },
      { ...tPrio1, done: true },
      { ...tPrio3, done: true },
    ]
    const completedSelection = selectBig3ForDay(
      completedTasks,
      sampleTags,
      sampleLists,
      '2025-10-15',
    )
    assertEquals(completedSelection.top3.length, 3, 'Top 3 com 3 concluídas')
    assertEquals(completedSelection.top3DoneCount, 3, '3 concluídas no top3')
    assertEquals(completedSelection.isCompleted, true, 'Deve marcar Big3 completo')
  }

  // 10. Testes do Relatório Semanal de Foco (cruzamento com metas, deltas e edge cases)
  {
    // 10.1 Cálculo de segunda-feira ISO (semana padrão Brasil)
    const refQuarta = new Date(2025, 9, 15, 14, 0, 0) // Quarta-feira 15/10/2025
    const monday = getMondayOfIsoWeek(refQuarta)
    assertEquals(monday.getFullYear(), 2025, 'Ano correto para a segunda-feira')
    assertEquals(monday.getMonth(), 9, 'Mês de outubro (9)')
    assertEquals(monday.getDate(), 13, 'Segunda-feira correspondente é dia 13/10/2025')
    assertEquals(monday.getDay(), 1, 'Dia da semana deve ser 1 (segunda)')

    const refDomingo = new Date(2025, 9, 19, 22, 0, 0) // Domingo 19/10/2025
    const mondayFromDom = getMondayOfIsoWeek(refDomingo)
    assertEquals(mondayFromDom.getDate(), 13, 'Domingo pertence à semana iniciada no dia 13/10')

    // 10.2 Semana sem sessões e metas zeradas/padrão
    const userZeroGoals = {
      weekly_focus_goals: {
        seg: 0,
        ter: 0,
        qua: 0,
        qui: 0,
        sex: 0,
        sab: 0,
        dom: 0,
      },
    } as any

    const emptyReport = computeWeeklyReport({
      sessions: [],
      user: userZeroGoals,
      referenceDate: refQuarta,
      weekOffset: 0,
    })

    assertEquals(emptyReport.totalFocusMinutes, 0, 'Total focado de semana vazia deve ser 0')
    assertEquals(emptyReport.totalGoalMinutes, 0, 'Total de metas zeradas deve ser 0')
    assertEquals(emptyReport.overallPercentage, 0, 'Sem metas e sem foco deve dar 0%')
    assertEquals(emptyReport.daysWithGoalCount, 0, 'Nenhum dia com meta')
    assertEquals(emptyReport.daysGoalMetCount, 0, 'Nenhum dia atingido')
    assertEquals(emptyReport.bestDay, null, 'Melhor dia nulo quando não há foco')
    assertEquals(emptyReport.deltaMinutes, 0, 'Delta 0 sem sessões anteriores')
    assertEquals(emptyReport.deltaPercentage, null, 'Delta % nulo quando base anterior é zero')
    assertEquals(emptyReport.topTasks.length, 0, 'Sem tarefas na semana')

    // 10.3 Cruzamento de sessões com metas variadas por dia da semana
    const customUser = {
      weekly_focus_goals: {
        seg: 120, // 2h
        ter: 100,
        qua: 60,
        qui: 120,
        sex: 90,
        sab: 0, // folga
        dom: 0, // folga
      },
    } as any

    const sampleSessions: any[] = [
      // Segunda 13/10: 130 min focados (meta 120 -> bateu)
      {
        id: 's1',
        task: 'task_a',
        session_date: '2025-10-13',
        started_at: '2025-10-13T09:00:00',
        duration_minutes: 70,
        status: 'completa',
        expand: { task: { title: 'Tarefa Alpha' } },
      },
      {
        id: 's2',
        task: 'task_a',
        session_date: '2025-10-13',
        started_at: '2025-10-13T14:00:00',
        duration_minutes: 60,
        status: 'completa',
        expand: { task: { title: 'Tarefa Alpha' } },
      },
      // Terça 14/10: 50 min focados (meta 100 -> não bateu)
      {
        id: 's3',
        task: 'task_b',
        session_date: '2025-10-14',
        started_at: '2025-10-14T10:00:00',
        duration_minutes: 50,
        status: 'interrompida',
        expand: { task: { title: 'Tarefa Beta' } },
      },
      // Quarta 15/10: 60 min focados (meta 60 -> bateu exatamente 100%)
      {
        id: 's4',
        task: 'task_b',
        session_date: '2025-10-15',
        started_at: '2025-10-15T11:00:00',
        duration_minutes: 60,
        status: 'completa',
        expand: { task: { title: 'Tarefa Beta' } },
      },
      // Sábado 18/10: 30 min focados em dia sem meta (hasGoal=false, isGoalReached=false)
      {
        id: 's5',
        task: 'task_c',
        session_date: '2025-10-18',
        started_at: '2025-10-18T16:00:00',
        duration_minutes: 30,
        status: 'completa',
        expand: { task: { title: 'Tarefa Gama' } },
      },
      // Semana anterior (Quinta 09/10): 100 min focados para testar delta
      {
        id: 's_prev',
        task: 'task_a',
        session_date: '2025-10-09',
        started_at: '2025-10-09T10:00:00',
        duration_minutes: 100,
        status: 'completa',
        expand: { task: { title: 'Tarefa Alpha' } },
      },
    ]

    const fullReport = computeWeeklyReport({
      sessions: sampleSessions,
      user: customUser,
      referenceDate: refQuarta,
      weekOffset: 0,
    })

    // Total focado semana: 130 + 50 + 60 + 30 = 270 min
    assertEquals(fullReport.totalFocusMinutes, 270, 'Total focado deve somar 270 min')
    // Total metas: 120 + 100 + 60 + 120 + 90 + 0 + 0 = 490 min
    assertEquals(fullReport.totalGoalMinutes, 490, 'Total de metas semanais deve ser 490 min')
    // % cumprido: round(270 / 490 * 100) = 55%
    assertEquals(fullReport.overallPercentage, 55, 'Percentual geral de 55%')

    // Dias com meta: seg, ter, qua, qui, sex = 5 dias
    assertEquals(fullReport.daysWithGoalCount, 5, '5 dias da semana possuem meta ativa')
    // Dias que bateram: seg (130>=120) e qua (60>=60) = 2 dias
    assertEquals(fullReport.daysGoalMetCount, 2, '2 dias atingiram a meta')

    // Sessões: 4 na semana atual (3 completas, 1 interrompida)
    assertEquals(fullReport.totalSessionsCount, 4, '4 sessões na semana')
    assertEquals(fullReport.completedSessionsCount, 3, '3 sessões completas')
    assertEquals(fullReport.interruptedSessionsCount, 1, '1 sessão interrompida')
    assertEquals(fullReport.completionRate, 75, 'Taxa de conclusão de 75%')

    // Melhor dia da semana: Segunda-feira com 130 min
    assertEquals(fullReport.bestDay?.dateStr, '2025-10-13', 'Melhor dia foi 13/10')
    assertEquals(fullReport.bestDay?.minutes, 130, 'Melhor dia teve 130 minutos')

    // Delta com semana anterior: 270 - 100 = +170 min
    assertEquals(fullReport.previousWeekTotalMinutes, 100, 'Semana passada teve 100 min')
    assertEquals(fullReport.deltaMinutes, 170, 'Delta de +170 minutos')
    // delta %: round(170 / 100 * 100) = +170%
    assertEquals(fullReport.deltaPercentage, 170, 'Variação relativa de +170%')

    // Top tarefas:
    // task_a: 130 min (2 sessões)
    // task_b: 110 min (2 sessões)
    // task_c: 30 min (1 sessão)
    assertEquals(fullReport.topTasks[0].taskId, 'task_a', 'Top 1 tarefa é task_a')
    assertEquals(fullReport.topTasks[0].minutes, 130, 'Task A acumulou 130 min')
    assertEquals(fullReport.topTasks[1].taskId, 'task_b', 'Top 2 tarefa é task_b')
    assertEquals(fullReport.topTasks[1].minutes, 110, 'Task B acumulou 110 min')
    assertEquals(fullReport.topTasks[2].taskId, 'task_c', 'Top 3 tarefa é task_c')
    assertEquals(fullReport.topTasks[2].minutes, 30, 'Task C acumulou 30 min')
  }

  // 9. Testes de Vinculação de Tarefa ao Pomodoro (selectedTask & fallback de UI)
  {
    const dummyTask = {
      id: 'task_test_pomo',
      title: 'Tarefa Pomodoro Vinculada',
      done: false,
    } as any

    // 9.1 Seleção com timer inativo guarda pendente
    let state: any = null
    let selectedTask: any = null
    const selectTask = (t: any) => {
      selectedTask = t
      if (state) state = { ...state, task: t }
    }

    selectTask(dummyTask)
    assertEquals(selectedTask?.id, 'task_test_pomo', 'selectedTask guardou a tarefa antes do play')
    assertEquals(state, null, 'Timer permanece inativo')

    // 9.2 Fallback da UI: state?.task ?? selectedTask
    const currentLinkedTask = state?.task ?? selectedTask
    assertEquals(
      currentLinkedTask?.title,
      'Tarefa Pomodoro Vinculada',
      'UI resolve a tarefa vinculada mesmo inativo',
    )

    // 9.3 Toggle nasce com a selectedTask
    state = {
      task: selectedTask,
      status: 'rodando',
    }
    assertEquals(state.task?.id, 'task_test_pomo', 'Toggle iniciou com a tarefa pendente')

    // 9.4 Troca no meio da sessão
    const dummyTask2 = { id: 'task_test_2', title: 'Segunda Tarefa' } as any
    selectTask(dummyTask2)
    assertEquals(state.task?.id, 'task_test_2', 'Troca no meio da sessão atualizou state.task')
    assertEquals(selectedTask?.id, 'task_test_2', 'Troca no meio atualizou selectedTask')

    // 9.5 Desvincular tarefa
    selectTask(null)
    assertEquals(state.task, null, 'Desvinculação limpou state.task')
    assertEquals(selectedTask, null, 'Desvinculação limpou selectedTask')
  }

  return true
}

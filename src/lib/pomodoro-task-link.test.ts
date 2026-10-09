// src/lib/pomodoro-task-link.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskRecord } from '../types'
import { recordSession } from '../services/data'
import pb from './pocketbase/client'

// Mocks do PocketBase para testar gravação e atualização de tarefas
vi.mock('./pocketbase/client', () => {
  const authStore = {
    record: { id: 'usr_test_123', email: 'test@barbosa.local' },
  }
  return {
    default: {
      authStore,
      collection: vi.fn(),
    },
  }
})

describe('Vinculação de Tarefas no Pomodoro', () => {
  const dummyTask1: TaskRecord = {
    id: 'task_001',
    collectionId: 'col_tasks',
    collectionName: 'tasks',
    user: 'usr_test_123',
    title: 'Elaborar Proposta Comercial',
    list: '',
    tags: [],
    due_date: '2026-04-15',
    due_time: '14:00',
    done: false,
    estimated_minutes: 50,
    actual_minutes: 25,
    order: 1,
    priority: 1,
    subtasks: [],
    created: '2026-04-01T10:00:00Z',
    updated: '2026-04-01T10:00:00Z',
  }

  const dummyTask2: TaskRecord = {
    id: 'task_002',
    collectionId: 'col_tasks',
    collectionName: 'tasks',
    user: 'usr_test_123',
    title: 'Revisar Planilha Financeira',
    list: '',
    tags: [],
    due_date: '2026-04-15',
    due_time: '16:00',
    done: false,
    estimated_minutes: 25,
    actual_minutes: 0,
    order: 2,
    priority: 2,
    subtasks: [],
    created: '2026-04-01T11:00:00Z',
    updated: '2026-04-01T11:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('(a) Seleção com timer inativo define a tarefa pendente (selectedTask) e fallback da UI', () => {
    // Simula a lógica do PomodoroContext:
    let state: { task: TaskRecord | null } | null = null
    let selectedTask: TaskRecord | null = null

    const selectTask = (t: TaskRecord | null) => {
      selectedTask = t
      if (state) {
        state = { ...state, task: t }
      }
    }

    // Timer inativo (state === null)
    expect(state).toBeNull()
    expect(selectedTask).toBeNull()

    // UI lê currentLinkedTask = state?.task ?? selectedTask
    let currentLinkedTask = state?.task ?? selectedTask
    expect(currentLinkedTask).toBeNull()

    // Usuário seleciona tarefa 1 antes de dar play
    selectTask(dummyTask1)

    expect(selectedTask).toEqual(dummyTask1)
    expect(state).toBeNull() // continua inativo
    currentLinkedTask = state?.task ?? selectedTask
    expect(currentLinkedTask?.title).toBe('Elaborar Proposta Comercial')
  })

  it('(b) toggle e start iniciam o timer nascendo com a tarefa certa (selectedTask)', () => {
    let state: { task: TaskRecord | null; status: string } | null = null
    let selectedTask: TaskRecord | null = dummyTask1

    // Simula o toggle quando inativo: fresh state usa selectedTask como task
    const toggle = () => {
      if (!state) {
        state = {
          task: selectedTask,
          status: 'rodando',
        }
      }
    }

    toggle()
    expect(state).not.toBeNull()
    expect(state!.task).toEqual(dummyTask1)
    expect(state!.task!.id).toBe('task_001')

    // Reset para testar start com fallback quando argumento não é fornecido
    state = null
    selectedTask = dummyTask2

    const start = (taskArg?: TaskRecord | null) => {
      const effectiveTask = taskArg !== undefined ? taskArg : (selectedTask ?? null)
      selectedTask = effectiveTask
      state = {
        task: effectiveTask,
        status: 'rodando',
      }
    }

    // start() sem argumento usa selectedTask
    start()
    expect(state!.task).toEqual(dummyTask2)
    expect(state!.task!.id).toBe('task_002')

    // start(dummyTask1) com argumento explícito sobrescreve e atualiza selectedTask
    start(dummyTask1)
    expect(state!.task).toEqual(dummyTask1)
    expect(selectedTask).toEqual(dummyTask1)
  })

  it('(c) Troca de tarefa no meio da sessão ativa atualiza tanto state.task quanto selectedTask', () => {
    let state: { task: TaskRecord | null } | null = { task: dummyTask1 }
    let selectedTask: TaskRecord | null = dummyTask1

    const selectTask = (t: TaskRecord | null) => {
      selectedTask = t
      if (state) {
        state = { ...state, task: t }
      }
    }

    // Troca para dummyTask2 enquanto roda
    selectTask(dummyTask2)
    expect(state!.task).toEqual(dummyTask2)
    expect(selectedTask).toEqual(dummyTask2)

    // Desvincula (modo foco livre)
    selectTask(null)
    expect(state!.task).toBeNull()
    expect(selectedTask).toBeNull()
  })

  it('(d) Sessão gravada (recordSession) recebe o ID da tarefa vinculada e incrementa actual_minutes', async () => {
    const mockCreatedSession = {
      id: 'session_789',
      task: dummyTask1.id,
      user: 'usr_test_123',
      duration_minutes: 25,
      status: 'completa',
    }

    const mockCreate = vi.fn().mockResolvedValue(mockCreatedSession)
    const mockGetOne = vi.fn().mockResolvedValue({
      ...dummyTask1,
      actual_minutes: 25,
    })
    const mockUpdate = vi.fn().mockResolvedValue({
      ...dummyTask1,
      actual_minutes: 50,
    })

    ;(pb.collection as unknown as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === 'sessions') {
        return { create: mockCreate }
      }
      if (name === 'tasks') {
        return { getOne: mockGetOne, update: mockUpdate }
      }
      return {}
    })

    const startedAt = new Date('2026-04-15T14:00:00.000Z')
    const endedAt = new Date('2026-04-15T14:25:00.000Z')

    const session = await recordSession(
      dummyTask1,
      startedAt,
      endedAt,
      25,
      'completa',
      'Foco finalizado com sucesso',
    )

    // Valida gravação da sessão com task = dummyTask1.id
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const payloadPassed = mockCreate.mock.calls[0][0]
    expect(payloadPassed.task).toBe('task_001')
    expect(payloadPassed.duration_minutes).toBe(25)
    expect(payloadPassed.status).toBe('completa')
    expect(payloadPassed.note).toBe('Foco finalizado com sucesso')
    expect(session.id).toBe('session_789')

    // Valida incremento de actual_minutes na tarefa
    expect(mockGetOne).toHaveBeenCalledWith('task_001')
    expect(mockUpdate).toHaveBeenCalledWith('task_001', {
      actual_minutes: 50,
    })
  })
})

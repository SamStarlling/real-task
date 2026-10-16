import { useState } from 'react'
import { Pause, Play, Square, X, Check, MessageSquare, Target } from 'lucide-react'
import { usePomodoro } from '@/contexts/PomodoroContext'
import type { SessionRecord } from '@/types'

export function PomodoroWidget() {
  const {
    state,
    selectedTask,
    currentObjective,
    setCurrentObjective,
    seconds,
    overtimeSeconds,
    isOvertime,
    toggle,
    finish,
    discard,
    start,
    startBreakFromOvertime,
    startNextBlockFromBreak,
    pendingNote,
    submitPendingNote,
    dismissPendingNote,
    isReadOnlyTab,
  } = usePomodoro()
  const [doneInput, setDoneInput] = useState('')
  const [nextInput, setNextInput] = useState('')
  const [selectedVerdict, setSelectedVerdict] = useState<SessionRecord['outcome_status'] | null>(
    null,
  )

  if (!state && !pendingNote) return null

  const minutes = Math.floor(seconds / 60)
  const remainingSec = seconds % 60
  const timerDisplay = isOvertime
    ? `+${String(Math.floor(overtimeSeconds / 60)).padStart(2, '0')}:${String(overtimeSeconds % 60).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`

  const progressRatio = state
    ? state.totalDurationSeconds > 0
      ? Math.max(0, Math.min(1, 1 - seconds / state.totalDurationSeconds))
      : 0
    : 0

  const phaseLabel = state
    ? state.phase === 'foco'
      ? `FOCO · BLOCO ${state.currentBlock}/${state.totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
      : state.phase === 'descanso_longo'
        ? `DESCANSO LONGO${isOvertime ? ' (EXCESSO)' : ''}`
        : `DESCANSO CURTO${isOvertime ? ' (EXCESSO)' : ''}`
    : ''

  const handleConfirmNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    submitPendingNote({
      doneText: doneInput,
      nextText: nextInput,
      outcomeStatus: selectedVerdict || undefined,
      objective: pendingNote?.objective,
    })
    setDoneInput('')
    setNextInput('')
    setSelectedVerdict(null)
  }

  const handleDismissNote = () => {
    dismissPendingNote()
    setDoneInput('')
    setNextInput('')
    setSelectedVerdict(null)
  }

  return (
    <aside className="pomodoro">
      {pendingNote && (
        <form
          onSubmit={handleConfirmNote}
          style={{
            marginBottom: '10px',
            padding: '8px 10px',
            background: 'rgba(197, 168, 128, 0.08)',
            border: '1px solid rgba(197, 168, 128, 0.25)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              color: '#C5A880',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={11} /> Bloco {pendingNote.blockNumber} (
              {pendingNote.durationMinutes}m)
            </span>
            <button
              type="button"
              onClick={handleDismissNote}
              style={{
                background: 'transparent',
                border: 0,
                color: '#A1A1AA',
                cursor: 'pointer',
                padding: '0 2px',
              }}
              title="Pular nota (Esc)"
            >
              <X size={12} />
            </button>
          </div>

          {/* Veredito de 1 toque se havia objetivo */}
          {pendingNote.objective && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#A1A1AA',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Objetivo: <strong style={{ color: '#F4F4F6' }}>{pendingNote.objective}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedVerdict('batido')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    fontFamily: "'Space Mono', monospace",
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: selectedVerdict === 'batido' ? '#C5A880' : 'rgba(255,255,255,0.1)',
                    background: selectedVerdict === 'batido' ? '#C5A880' : 'rgba(255,255,255,0.05)',
                    color: selectedVerdict === 'batido' ? '#090A0E' : '#F4F4F6',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✓ Batido
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVerdict('parcial')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    fontFamily: "'Space Mono', monospace",
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor:
                      selectedVerdict === 'parcial' ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                    background:
                      selectedVerdict === 'parcial' ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                    color: selectedVerdict === 'parcial' ? '#090A0E' : '#F4F4F6',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ~ Parcial
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVerdict('nao_foi')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    fontFamily: "'Space Mono', monospace",
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor:
                      selectedVerdict === 'nao_foi' ? '#71717A' : 'rgba(255,255,255,0.1)',
                    background:
                      selectedVerdict === 'nao_foi' ? '#71717A' : 'rgba(255,255,255,0.05)',
                    color: '#F4F4F6',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✗ Não foi
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              autoFocus={!pendingNote.objective}
              maxLength={250}
              placeholder="O que foi feito? (opcional)"
              value={doneInput}
              onChange={(e) => setDoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleDismissNote()
                }
              }}
              style={{
                background: '#090A0E',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#F4F4F6',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
              }}
            />
            <input
              type="text"
              maxLength={250}
              placeholder="O que fica para o próximo bloco? (opcional)"
              value={nextInput}
              onChange={(e) => setNextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleDismissNote()
                }
              }}
              style={{
                background: '#090A0E',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#F4F4F6',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={handleDismissNote}
              style={{
                background: 'transparent',
                border: 0,
                color: '#A1A1AA',
                fontSize: '10px',
                fontFamily: "'Space Mono', monospace",
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              Pular
            </button>
            <button
              type="submit"
              style={{
                background: '#C5A880',
                border: 0,
                borderRadius: '4px',
                color: '#090A0E',
                padding: '3px 8px',
                fontSize: '10px',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {state && (
        <>
          <div className="eyebrow" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{phaseLabel}</span>
            <span style={{ opacity: 0.7 }}>{state.preset.name}</span>
          </div>
          <strong>{state.task?.title || selectedTask?.title || 'Sem tarefa vinculada'}</strong>

          {/* Âncora anti-drift no widget flutuante */}
          {state.objective && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: '#C5A880',
                background: 'rgba(197, 168, 128, 0.08)',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                borderRadius: '4px',
                padding: '2px 6px',
                margin: '2px 0 4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={`Objetivo: ${state.objective}`}
            >
              <Target size={10} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.objective}
              </span>
            </div>
          )}
          {isReadOnlyTab && (
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: '#C5A880',
                letterSpacing: '0.06em',
                background: 'rgba(197, 168, 128, 0.1)',
                border: '1px solid rgba(197, 168, 128, 0.25)',
                padding: '3px 8px',
                borderRadius: '4px',
                margin: '4px 0 6px',
              }}
            >
              Timer ativo em outra aba (somente leitura)
            </div>
          )}

          {/* Botão de transição manual em modo de excesso */}
          {isOvertime && !isReadOnlyTab && (
            <div style={{ margin: '6px 0' }}>
              {state.phase === 'foco' ? (
                <button
                  type="button"
                  onClick={startBreakFromOvertime}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: '#C5A880',
                    color: '#090A0E',
                    border: 0,
                    borderRadius: '6px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  Iniciar Pausa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startNextBlockFromBreak}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: '#C5A880',
                    color: '#090A0E',
                    border: 0,
                    borderRadius: '6px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  Iniciar Próximo Bloco
                </button>
              )}
            </div>
          )}

          <div className="pomodoro-row">
            <div
              className={`timer ${isOvertime ? 'overtime' : ''}`}
              style={
                {
                  '--progress': `${(isOvertime ? 1 : progressRatio) * 360}deg`,
                  color: isOvertime ? '#C5A880' : undefined,
                } as React.CSSProperties
              }
            >
              <span>{timerDisplay}</span>
            </div>
            {!isReadOnlyTab && (
              <>
                <button
                  className="primary icon"
                  onClick={toggle}
                  title={state.status === 'rodando' ? 'Pausar' : 'Retomar'}
                >
                  {state.status === 'rodando' ? <Pause /> : <Play />}
                </button>
                <button className="icon" onClick={() => finish()} title="Encerrar e registrar">
                  <Square />
                </button>
                <button className="icon" onClick={discard} title="Descartar">
                  <X />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

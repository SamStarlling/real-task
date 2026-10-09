import { useState } from 'react'
import { Pause, Play, Square, X, Check, MessageSquare } from 'lucide-react'
import { usePomodoro } from '@/contexts/PomodoroContext'

export function PomodoroWidget() {
  const {
    state,
    selectedTask,
    seconds,
    overtimeSeconds,
    isOvertime,
    toggle,
    finish,
    discard,
    startBreakFromOvertime,
    startNextBlockFromBreak,
    pendingNote,
    submitPendingNote,
    dismissPendingNote,
    isReadOnlyTab,
  } = usePomodoro()
  const [noteInput, setNoteInput] = useState('')

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
    submitPendingNote(noteInput)
    setNoteInput('')
  }

  const handleDismissNote = () => {
    dismissPendingNote()
    setNoteInput('')
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
              <MessageSquare size={11} /> Bloco {pendingNote.blockNumber} concluído
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
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              autoFocus
              maxLength={500}
              placeholder="O que foi feito? (opcional)"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleDismissNote()
                }
              }}
              style={{
                flex: 1,
                background: '#090A0E',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                color: '#F4F4F6',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#C5A880',
                border: 0,
                borderRadius: '4px',
                color: '#090A0E',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
              title="Confirmar nota (Enter)"
            >
              <Check size={13} />
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

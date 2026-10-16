import { useState } from 'react'
import {
  Pause,
  Play,
  Square,
  X,
  Check,
  MessageSquare,
  Target,
  Plus,
  Minus,
  Timer,
  Clock,
} from 'lucide-react'
import { usePomodoro } from '@/contexts/PomodoroContext'
import type { SessionRecord } from '@/types'

export function PomodoroWidget() {
  const {
    timerMode,
    setTimerMode,
    state,
    selectedTask,
    currentObjective,
    setCurrentObjective,
    setObjectiveForRunningBlock,
    seconds,
    overtimeSeconds,
    isOvertime,
    stopwatchSeconds,
    activePreset,
    setWorkMinutes,
    start,
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

  const [doneInput, setDoneInput] = useState('')
  const [nextInput, setNextInput] = useState('')
  const [selectedVerdict, setSelectedVerdict] = useState<SessionRecord['outcome_status'] | null>(
    null,
  )

  if (!state && !pendingNote && !selectedTask) return null

  const currentMode = state?.mode || timerMode
  const isStopwatch = currentMode === 'stopwatch'

  let timerDisplay = ''
  if (isStopwatch) {
    const totalSec = stopwatchSeconds
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    timerDisplay =
      h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  } else if (isOvertime) {
    timerDisplay = `+${String(Math.floor(overtimeSeconds / 60)).padStart(2, '0')}:${String(overtimeSeconds % 60).padStart(2, '0')}`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSec = seconds % 60
    timerDisplay = `${String(minutes).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`
  }

  const progressRatio = isStopwatch
    ? 1
    : state
      ? state.totalDurationSeconds > 0
        ? Math.max(0, Math.min(1, 1 - seconds / state.totalDurationSeconds))
        : 0
      : 0

  const phaseLabel = isStopwatch
    ? 'STOPWATCH · FOCO CRESCENTE'
    : state
      ? state.phase === 'foco'
        ? `FOCO · BLOCO ${state.currentBlock}/${state.totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
        : state.phase === 'descanso_longo'
          ? `DESCANSO LONGO${isOvertime ? ' (EXCESSO)' : ''}`
          : `DESCANSO CURTO${isOvertime ? ' (EXCESSO)' : ''}`
      : 'PRONTO PARA INICIAR'

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

          {/* Veredito de 1 toque: selo visual padronizado do objetivo pós-foco */}
          {pendingNote.objective && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: '#090A0E',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                borderRadius: '8px',
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#C5A880',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                <Target size={11} style={{ color: '#C5A880', flexShrink: 0 }} />
                <span>OBJETIVO DO BLOCO</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#F4F4F6',
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  borderLeft: '2px solid #C5A880',
                  paddingLeft: '8px',
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                }}
                title={pendingNote.objective}
              >
                "{pendingNote.objective}"
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedVerdict('batido')}
                  style={{
                    padding: '4px 6px',
                    fontSize: '10px',
                    fontFamily: "'Space Mono', monospace",
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: selectedVerdict === 'batido' ? '#C5A880' : 'rgba(255,255,255,0.1)',
                    background: selectedVerdict === 'batido' ? '#C5A880' : 'rgba(255,255,255,0.05)',
                    color: selectedVerdict === 'batido' ? '#090A0E' : '#F4F4F6',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                  }}
                >
                  <Check size={11} /> Batido
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVerdict('parcial')}
                  style={{
                    padding: '4px 6px',
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                  }}
                >
                  <span>~</span> Parcial
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVerdict('nao_foi')}
                  style={{
                    padding: '4px 6px',
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                  }}
                >
                  <X size={11} /> Não foi
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

      {/* Widget Ativo ou Pré-início com tarefa selecionada */}
      {(state || selectedTask) && (
        <>
          {/* Seletor de modo Pomo / Stopwatch no widget */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: '#A1A1AA',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              MODO
            </span>
            <div
              style={{
                display: 'inline-flex',
                background: '#090A0E',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setTimerMode('pomo')}
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  fontFamily: "'Space Mono', monospace",
                  borderRadius: '4px',
                  border: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: currentMode === 'pomo' ? '#C5A880' : 'transparent',
                  color: currentMode === 'pomo' ? '#090A0E' : '#A1A1AA',
                  fontWeight: currentMode === 'pomo' ? 700 : 400,
                }}
              >
                <Timer size={10} /> Pomo
              </button>
              <button
                type="button"
                onClick={() => setTimerMode('stopwatch')}
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  fontFamily: "'Space Mono', monospace",
                  borderRadius: '4px',
                  border: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: currentMode === 'stopwatch' ? '#C5A880' : 'transparent',
                  color: currentMode === 'stopwatch' ? '#090A0E' : '#A1A1AA',
                  fontWeight: currentMode === 'stopwatch' ? 700 : 400,
                }}
              >
                <Clock size={10} /> Stopwatch
              </button>
            </div>
          </div>

          <div className="eyebrow" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{phaseLabel}</span>
            <span style={{ opacity: 0.7 }}>
              {isStopwatch ? 'LIVRE' : state?.preset?.name || activePreset.name}
            </span>
          </div>
          <strong>{state?.task?.title || selectedTask?.title || 'Sem tarefa vinculada'}</strong>

          {/* Âncora anti-drift no widget flutuante (pill refinada com borda champagne e tooltip) */}
          {state?.objective ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: '#F4F4F6',
                background: 'rgba(197, 168, 128, 0.12)',
                border: '1px solid #C5A880',
                borderRadius: '9999px',
                padding: '2px 8px',
                margin: '3px 0 5px',
                maxWidth: '100%',
                overflow: 'hidden',
                boxShadow: '0 0 8px rgba(197, 168, 128, 0.15)',
              }}
              title={`Objetivo do Bloco: ${state.objective}`}
            >
              <span
                style={{ display: 'inline-flex', cursor: 'help' }}
                title={`Objetivo do Bloco: ${state.objective}`}
              >
                <Target size={10} style={{ color: '#C5A880', flexShrink: 0 }} />
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                }}
              >
                {state.objective}
              </span>
            </div>
          ) : (
            /* Campo de definição do objetivo do bloco: rótulo OBJETIVO DO BLOCO em Space Mono maiúsculo, champagne #C5A880, valor editável */
            <div style={{ marginTop: '4px', marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{ display: 'inline-flex', cursor: 'help' }}
                  title={`Objetivo do Bloco: ${currentObjective || selectedTask?.title || 'Definir objetivo'}`}
                >
                  <Target size={11} style={{ color: '#C5A880', flexShrink: 0 }} />
                </span>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#C5A880',
                  }}
                >
                  OBJETIVO DO BLOCO
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#090A0E',
                  border: '1px solid rgba(197, 168, 128, 0.25)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                }}
              >
                <input
                  type="text"
                  maxLength={300}
                  value={currentObjective}
                  onChange={(e) => {
                    setCurrentObjective(e.target.value)
                    if (state) {
                      setObjectiveForRunningBlock(e.target.value)
                    }
                  }}
                  placeholder={
                    selectedTask?.title || 'O que deve existir ao fim do bloco? (opcional)'
                  }
                  title="Objetivo do bloco: valor pré-preenchido editável salvo ao dar play"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '11px',
                    color: '#F4F4F6',
                  }}
                />
              </div>
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
          {state && isOvertime && !isReadOnlyTab && (
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

          {/* Stepper rápido de 1 em 1 minuto no widget quando parado e em modo Pomo */}
          {!state && currentMode === 'pomo' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#090A0E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '3px 8px',
                margin: '4px 0 8px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '9px',
                  color: '#A1A1AA',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                DURAÇÃO
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setWorkMinutes(activePreset.workMinutes - 1)}
                  disabled={activePreset.workMinutes <= 1}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 0,
                    borderRadius: '4px',
                    color: '#F4F4F6',
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: activePreset.workMinutes <= 1 ? 0.3 : 1,
                  }}
                  title="-1 min"
                >
                  <Minus size={10} />
                </button>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#C5A880',
                    minWidth: '28px',
                    textAlign: 'center',
                  }}
                >
                  {activePreset.workMinutes}m
                </span>
                <button
                  type="button"
                  onClick={() => setWorkMinutes(activePreset.workMinutes + 1)}
                  disabled={activePreset.workMinutes >= 180}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 0,
                    borderRadius: '4px',
                    color: '#F4F4F6',
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: activePreset.workMinutes >= 180 ? 0.3 : 1,
                  }}
                  title="+1 min"
                >
                  <Plus size={10} />
                </button>
              </div>
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
                  onClick={() => {
                    if (!state) {
                      const objToSave = currentObjective.trim() || selectedTask?.title || ''
                      start(selectedTask, undefined, objToSave, currentMode)
                    } else {
                      toggle()
                    }
                  }}
                  title={
                    !state ? 'Iniciar foco' : state.status === 'rodando' ? 'Pausar' : 'Retomar'
                  }
                >
                  {state && state.status === 'rodando' ? <Pause /> : <Play />}
                </button>
                {state && (
                  <>
                    <button className="icon" onClick={() => finish()} title="Encerrar e registrar">
                      <Square />
                    </button>
                    <button className="icon" onClick={discard} title="Descartar">
                      <X />
                    </button>
                  </>
                )}
                {!state && selectedTask && (
                  <button className="icon" onClick={discard} title="Descartar seleção">
                    <X />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

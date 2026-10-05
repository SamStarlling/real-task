// Gerador de áudio suave para transições do Pomodoro via Web Audio API nativa
// Sem dependência de arquivos externos ou assets de terceiros.
// Design System Barbosa: timbres quentes, discretos e elegantes (quiet luxury).

let audioCtx: AudioContext | null = null

/**
 * Obtém ou inicializa a instância do AudioContext.
 * Se o contexto estiver suspenso (política de autoplay dos navegadores),
 * tenta destravá-lo via resume().
 */
function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioCtx = new AudioContextClass()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Desbloqueia e ativa o AudioContext no contexto imediato de um gesto do usuário
 * (ex.: clique em Play, Iniciar Pausa, Próximo Bloco).
 * Chamar esta função síncronamente no handler de clique garante que o navegador
 * retire a suspensão de áudio e os sons subsequentes toquem perfeitamente.
 */
export function unlockAudioContext(): AudioContext | null {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

/**
 * Toca no INÍCIO de um bloco de foco.
 * Acorde suave com timbre harmônico cristalino e sutil (A4 -> C#5 -> E5, 440 -> 554.37 -> 659.25 Hz):
 * sinaliza imersão e concentração, discreto e polido.
 */
export function playFocusStartSound() {
  const ctx = unlockAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [440.0, 554.37, 659.25] // A4, C#5, E5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.08)

    gain.gain.setValueAtTime(0.0001, now + idx * 0.08)
    gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.08 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + idx * 0.08)
    osc.stop(now + idx * 0.08 + 0.55)
  })
}

/**
 * Toca quando um bloco de foco termina.
 * Acorde suave ascendente em tom quente (champagne/ouro) indicando dever cumprido:
 * C5 -> E5 -> G5 com envelope harmônico e fade out delicado.
 */
export function playFocusCompleteSound() {
  const ctx = unlockAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.12)

    gain.gain.setValueAtTime(0.0001, now + idx * 0.12)
    gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.7)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + idx * 0.12)
    osc.stop(now + idx * 0.12 + 0.75)
  })
}

/**
 * Toca quando um período de descanso (curto ou longo) termina.
 * Dois tons harmônicos descendentes e suaves chamando de volta à ação (G5 -> C5):
 * claro, discreto e não estridente.
 */
export function playBreakCompleteSound() {
  const ctx = unlockAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [783.99, 523.25] // G5 -> C5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now + idx * 0.18)

    gain.gain.setValueAtTime(0.0001, now + idx * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.18 + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + idx * 0.18)
    osc.stop(now + idx * 0.18 + 0.65)
  })
}

/**
 * Toca quando um lembrete/alerta de tarefa dispara.
 * Acorde suave em dois tons discretos e cristalinos (F5 -> A5):
 * elegante, não invasivo, estética quiet luxury.
 */
export function playReminderSound() {
  const ctx = unlockAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [698.46, 880.0] // F5, A5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.14)

    gain.gain.setValueAtTime(0.0001, now + idx * 0.14)
    gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.14 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + idx * 0.14)
    osc.stop(now + idx * 0.14 + 0.65)
  })
}

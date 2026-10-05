// Utilitário para favicon dinâmico via Canvas nativo
// Desenha o progresso do temporizador em Champagne Ouro Fosco (#C5A880) sobre fundo Carbono Obsidiana (#090A0E)
// Restaura o favicon padrão (/favicon.ico) quando inativo.

let defaultFaviconHref: string | null = null
let dynamicFaviconLink: HTMLLinkElement | null = null

function getOrCreateIconLink(): HTMLLinkElement {
  if (dynamicFaviconLink && document.head.contains(dynamicFaviconLink)) {
    return dynamicFaviconLink
  }
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  if (!defaultFaviconHref) {
    defaultFaviconHref = link.href || '/favicon.ico'
  }
  dynamicFaviconLink = link
  return link
}

/**
 * Atualiza o favicon com um arco de progresso circular.
 * @param progressRatio Valor entre 0 e 1 (progresso do tempo previsto)
 * @param isOvertime Se true, indica que passou do tempo previsto (desenha anel completo com indicador de excesso)
 * @param phase 'foco' | 'descanso'
 */
export function updateDynamicFavicon(
  progressRatio: number,
  isOvertime: boolean,
  phase: 'foco' | 'descanso',
) {
  try {
    const link = getOrCreateIconLink()
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fundo circular escuro (#090A0E)
    ctx.clearRect(0, 0, 64, 64)
    ctx.beginPath()
    ctx.arc(32, 32, 30, 0, Math.PI * 2)
    ctx.fillStyle = '#090A0E'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(197, 168, 128, 0.25)'
    ctx.stroke()

    // Trilha de fundo do anel
    ctx.beginPath()
    ctx.arc(32, 32, 23, 0, Math.PI * 2)
    ctx.lineWidth = 6
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.stroke()

    // Arco de progresso
    const startAngle = -Math.PI / 2
    const clampedRatio = Math.max(0, Math.min(1, progressRatio))
    const endAngle = startAngle + clampedRatio * (Math.PI * 2)

    ctx.beginPath()
    ctx.arc(32, 32, 23, startAngle, isOvertime ? startAngle + Math.PI * 2 : endAngle)
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    // Champagne Ouro Fosco para foco / Branco suave para descanso
    ctx.strokeStyle = isOvertime ? '#D4AF37' : phase === 'foco' ? '#C5A880' : '#A1A1AA'
    ctx.stroke()

    // Ponto central
    ctx.beginPath()
    ctx.arc(32, 32, 6, 0, Math.PI * 2)
    ctx.fillStyle = isOvertime ? '#C5A880' : phase === 'foco' ? '#C5A880' : '#E4E4E7'
    ctx.fill()

    link.type = 'image/png'
    link.href = canvas.toDataURL('image/png')
  } catch {
    // Ignora silenciosamente se o canvas não puder renderizar
  }
}

/**
 * Restaura o favicon original
 */
export function resetDynamicFavicon() {
  try {
    const link = getOrCreateIconLink()
    link.type = 'image/x-icon'
    link.href = defaultFaviconHref || '/favicon.ico'
  } catch {
    // Silencioso
  }
}

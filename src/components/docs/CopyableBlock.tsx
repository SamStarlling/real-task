import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface CopyableBlockProps {
  code: string
  language?: string
  title?: string
  className?: string
}

export function CopyableBlock({ code, language, title, className = '' }: CopyableBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback manual se clipboard API falhar
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={`relative my-3 rounded-lg border border-[#27272A] bg-[#0E1015] overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1F2028] bg-[#12141C]/80">
        <span className="font-mono text-[11px] text-[#A1A1AA] uppercase tracking-wider">
          {title || language || 'Exemplo / Código'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono text-[#C5A880] hover:text-[#E2D4BC] hover:bg-[#C5A880]/10 transition-colors border border-transparent hover:border-[#C5A880]/20"
          title="Copiar para a área de transferência"
          aria-label="Copiar conteúdo"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 font-mono text-xs text-[#E4E4E7] overflow-x-auto leading-relaxed whitespace-pre scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  )
}

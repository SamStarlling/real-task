import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CaptureBar } from '@/components/CaptureBar'
import { Sparkles, X } from 'lucide-react'

interface CaptureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CaptureModal({ open, onOpenChange, onCreated }: CaptureModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Foco automático ao abrir o modal
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const input = containerRef.current?.querySelector<HTMLInputElement>('.capture-input input')
        input?.focus()
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12141C] border border-[rgba(197,168,128,0.25)] text-[#F4F4F6] sm:max-w-2xl p-0 shadow-2xl overflow-visible gap-0 rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[rgba(255,255,255,0.06)] text-left flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="font-['Space_Mono'] text-xs font-bold text-[#C5A880] tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>CAPTURA GLOBAL DE TAREFA</span>
              <span className="text-[10px] text-[#71717A] font-normal normal-case tracking-normal">
                (Atalho{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#C5A880] font-mono text-[10px] border border-[rgba(197,168,128,0.2)]">
                  C
                </kbd>
                )
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA] mt-1">
              Linguagem natural: digite datas, horários, prioridade (p1–p4), @etiqueta, #projeto e
              repetição.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#F4F4F6] hover:bg-white/5 transition-colors"
            title="Fechar (Esc)"
            aria-label="Fechar modal de captura"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="p-5" ref={containerRef}>
          <CaptureBar onCreated={onCreated} inModal={true} onClose={() => onOpenChange(false)} />

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] font-['Space_Mono'] text-[#71717A]">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[#A1A1AA] text-[10px] border border-white/10">
                  Enter
                </kbd>{' '}
                cria a tarefa
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[#A1A1AA] text-[10px] border border-white/10">
                  Esc
                </kbd>{' '}
                fecha
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-[#A1A1AA] hover:text-[#C5A880] transition-colors"
            >
              Concluir captura
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

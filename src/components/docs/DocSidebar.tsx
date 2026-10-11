import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface TocItem {
  id: string
  title: string
  num?: string
}

interface DocSidebarProps {
  items: TocItem[]
  activeId: string
  title?: string
}

export function DocSidebar({ items, activeId, title = 'Nesta página' }: DocSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Ao clicar em link no mobile, fechar colapso
  const handleClick = (id: string) => {
    setMobileOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Nome do item ativo para mostrar no botão do mobile
  const activeItem = items.find((it) => it.id === activeId) || items[0]

  return (
    <>
      {/* MOBILE: Sumário colapsável fixo no topo do conteúdo */}
      <div className="lg:hidden mb-6 sticky top-0 z-20 bg-[#090A0E]/95 backdrop-blur border border-[#27272A] rounded-lg p-2.5 shadow-lg">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between text-left px-2 py-1.5 text-xs font-mono text-[#F4F4F6]"
          aria-expanded={mobileOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Menu className="w-4 h-4 text-[#C5A880] flex-none" />
            <span className="text-[#A1A1AA] uppercase tracking-wider text-[11px]">Índice:</span>
            <span className="text-[#C5A880] truncate font-medium">
              {activeItem
                ? `${activeItem.num ? `${activeItem.num} ` : ''}${activeItem.title}`
                : 'Seções'}
            </span>
          </div>
          {mobileOpen ? (
            <ChevronDown className="w-4 h-4 text-[#A1A1AA] flex-none" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#A1A1AA] flex-none" />
          )}
        </button>

        {mobileOpen && (
          <nav className="mt-2 pt-2 border-t border-[#1F2028] max-h-64 overflow-y-auto space-y-1">
            {items.map((item) => {
              const isActive = activeId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#C5A880]/15 text-[#C5A880] font-medium border-l-2 border-[#C5A880]'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#12141C]'
                  }`}
                >
                  {item.num && (
                    <span className="font-mono text-[11px] text-[#71717A] flex-none">
                      {item.num}
                    </span>
                  )}
                  <span className="truncate">{item.title}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* DESKTOP: Sumário lateral fixo com indicador visual discreto */}
      <aside className="hidden lg:block w-64 flex-none sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto pr-3 scrollbar-thin">
        <div className="p-4 rounded-xl bg-[#12141C]/80 border border-[#27272A]/70 backdrop-blur">
          <span className="block font-mono text-[11px] uppercase tracking-widest text-[#71717A] mb-3">
            {title}
          </span>
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = activeId === item.id
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleClick(item.id)
                  }}
                  className={`group flex items-start gap-2.5 px-2.5 py-2 rounded-md text-xs transition-all leading-snug ${
                    isActive
                      ? 'bg-[#C5A880]/12 text-[#C5A880] font-medium border-l-2 border-[#C5A880]'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#181A22]'
                  }`}
                >
                  {item.num && (
                    <span
                      className={`font-mono text-[10px] mt-0.5 transition-colors ${
                        isActive ? 'text-[#C5A880]' : 'text-[#52525B] group-hover:text-[#A1A1AA]'
                      }`}
                    >
                      {item.num}
                    </span>
                  )}
                  <span className="break-words">{item.title}</span>
                </a>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

/** Hook para detectar qual seção está atualmente visível na viewport */
export function useActiveSection(sectionIds: string[], defaultId: string) {
  const [activeId, setActiveId] = useState<string>(defaultId)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i]
        const element = document.getElementById(id)
        if (element) {
          const top = element.offsetTop
          if (scrollPos >= top) {
            setActiveId(id)
            return
          }
        }
      }
      if (sectionIds.length > 0) {
        setActiveId(sectionIds[0])
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionIds])

  return activeId
}

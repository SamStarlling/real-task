import { BrandMark } from '@/components/Brand'
import { ArrowRight, BookOpen, Code2, Sparkles, Terminal, CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Docs() {
  return (
    <div className="page docs-page max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* CABEÇALHO DO HUB */}
      <header className="mb-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#27272A]/70 pb-6">
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#C5A880]">
                DOCUMENTAÇÃO
              </span>
              <span className="text-xs text-[#52525B]">·</span>
              <span className="font-mono text-[11px] text-[#A1A1AA]">BARBOSA SYSTEM</span>
            </div>
            <h1 className="font-['Clash_Display'] text-3xl sm:text-4xl font-semibold text-[#F4F4F6] tracking-tight">
              O que você quer fazer?
            </h1>
          </div>
          <span className="font-mono text-[11px] text-[#C5A880] px-3 py-1.5 rounded-md bg-[#C5A880]/10 border border-[#C5A880]/20 self-center sm:self-end">
            VERSÃO 0.0.34
          </span>
        </div>
        <p className="mt-4 text-sm sm:text-base text-[#A1A1AA] max-w-2xl leading-relaxed">
          Escolha o caminho mais direto para seu objetivo. Sem sobrecarga: o guia do usuário foca
          nas suas tarefas cotidianas, enquanto a documentação técnica reúne tudo sobre integração,
          MCP e arquitetura.
        </p>
      </header>

      {/* OS DOIS CARDS GRANDES POR AUDIÊNCIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* CARD 1: GUIA DO USUÁRIO */}
        <Link
          to="/guia"
          className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#12141C] border border-[#27272A] hover:border-[#C5A880]/60 transition-all duration-200 hover:shadow-xl hover:shadow-[#C5A880]/5 hover:-translate-y-0.5"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/25 flex items-center justify-center mb-5 group-hover:bg-[#C5A880]/15 transition-colors">
              <BookOpen className="w-6 h-6 text-[#C5A880]" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C5A880] px-2 py-0.5 rounded bg-[#C5A880]/10 border border-[#C5A880]/20">
                USUÁRIO FINAL
              </span>
              <span className="text-xs text-[#52525B]">·</span>
              <span className="font-mono text-[11px] text-[#71717A]">COMO USAR</span>
            </div>

            <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6] group-hover:text-[#C5A880] transition-colors mb-2.5 tracking-tight">
              Usar o sistema
            </h2>

            <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
              Aprenda a capturar pendências em português, organizar suas prioridades, usar o
              temporizador Pomodoro e planejar sua semana sem atritos.
            </p>

            <div className="space-y-2.5 pt-4 border-t border-[#1F2028] text-xs text-[#D4D4D8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Captura rápida inteligente com datas e horários</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Prioridades P1–P4, etiquetas, listas e Big3 (80/20)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Ciclos Pomodoro, notas pós-foco e histórico de recordes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Visão semanal com arrastar-e-soltar e sub-tarefas</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 flex items-center justify-between text-sm font-mono text-[#C5A880]">
            <span className="group-hover:underline">Acessar Guia do Usuário</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* CARD 2: DOCUMENTAÇÃO DE DESENVOLVEDOR / INTEGRAÇÃO */}
        <Link
          to="/dev"
          className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#12141C] border border-[#27272A] hover:border-[#C5A880]/60 transition-all duration-200 hover:shadow-xl hover:shadow-[#C5A880]/5 hover:-translate-y-0.5"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/25 flex items-center justify-center mb-5 group-hover:bg-[#C5A880]/15 transition-colors">
              <Terminal className="w-6 h-6 text-[#C5A880]" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C5A880] px-2 py-0.5 rounded bg-[#C5A880]/10 border border-[#C5A880]/20">
                DESENVOLVEDORES
              </span>
              <span className="text-xs text-[#52525B]">·</span>
              <span className="font-mono text-[11px] text-[#71717A]">INTEGRAÇÃO & MCP</span>
            </div>

            <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6] group-hover:text-[#C5A880] transition-colors mb-2.5 tracking-tight">
              Integrar / desenvolver
            </h2>

            <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
              Conecte assistentes de IA via Model Context Protocol (10 ferramentas nativas),
              consulte o schema do banco, tokens de design e convenções de arquitetura.
            </p>

            <div className="space-y-2.5 pt-4 border-t border-[#1F2028] text-xs text-[#D4D4D8]">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Servidor MCP oficial com Claude Code, Desktop e Gemini</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>10 ferramentas MCP (captura NL, sub-tarefas, tags 80/20)</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Schema PocketBase, tipagens, regras de acesso e índices</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[#C5A880] flex-none" />
                <span>Tokens de design, acessibilidade WCAG AA e breakpoints</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 flex items-center justify-between text-sm font-mono text-[#C5A880]">
            <span className="group-hover:underline">Acessar Documentação Técnica</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* BLOCO RÁPIDO: DESTAQUES DO SISTEMA */}
      <div className="p-5 rounded-xl bg-[#0E1015] border border-[#27272A]/70 mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#C5A880]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6]">
            Destaques da Versão 0.0.34
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#A1A1AA]">
          <div className="p-3 rounded-lg bg-[#12141C]/60 border border-[#1F2028]">
            <strong className="block text-[#F4F4F6] font-mono mb-1">NAVEGAÇÃO ERGONÔMICA</strong>
            Barra inferior de 5 destinos no mobile, drawer lateral completo e perfil integrado.
          </div>
          <div className="p-3 rounded-lg bg-[#12141C]/60 border border-[#1F2028]">
            <strong className="block text-[#F4F4F6] font-mono mb-1">MCP DE 10 FERRAMENTAS</strong>
            Parser nativo no servidor em pt-BR, suporte a sub-tarefas e gestão 80/20 via IA.
          </div>
          <div className="p-3 rounded-lg bg-[#12141C]/60 border border-[#1F2028]">
            <strong className="block text-[#F4F4F6] font-mono mb-1">FOCO & HISTÓRICO REAL</strong>
            Controle de excesso no Pomodoro, notas de sessão e cálculo do melhor dia da conta.
          </div>
        </div>
      </div>

      {/* RODAPÉ DO HUB COM AVISO DE REPOSITÓRIO PRIVADO */}
      <footer className="pt-8 border-t border-[#27272A]/60 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark className="w-6 h-6 object-contain opacity-80" />
          <p className="font-mono text-[11px] text-[#71717A] tracking-wider uppercase m-0">
            Barbosa System · Documentação Oficial
          </p>
        </div>
        <div className="font-mono text-[11px] text-[#52525B]">
          Documentação interna e privada da empresa disponível em repositório GitHub restrito.
        </div>
      </footer>
    </div>
  )
}

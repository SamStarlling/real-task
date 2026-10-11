import { BrandMark } from '@/components/Brand'
import { CopyableBlock } from '@/components/docs/CopyableBlock'
import { DocSidebar, TocItem, useActiveSection } from '@/components/docs/DocSidebar'
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  ListTodo,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const TOC_ITEMS: TocItem[] = [
  { id: 'comece-aqui', num: '00', title: 'Comece por aqui' },
  { id: 'capturar', num: '01', title: 'Capturar pendências' },
  { id: 'organizar', num: '02', title: 'Organizar e priorizar' },
  { id: 'focar', num: '03', title: 'Focar com Pomodoro' },
  { id: 'revisar', num: '04', title: 'Revisar semana e métricas' },
  { id: 'dicas-mobile', num: '05', title: 'Uso no celular' },
]

export function UserGuide() {
  const activeSection = useActiveSection(
    TOC_ITEMS.map((item) => item.id),
    'comece-aqui',
  )

  return (
    <div className="page docs-page max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* CABEÇALHO COM NAVEGAÇÃO DE VOLTA */}
      <div className="mb-6 flex items-center justify-between border-b border-[#27272A]/70 pb-4">
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#A1A1AA] hover:text-[#C5A880] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Hub de Documentação</span>
        </Link>
        <span className="font-mono text-[11px] text-[#C5A880] px-2.5 py-1 rounded bg-[#C5A880]/10 border border-[#C5A880]/20">
          GUIA DO USUÁRIO · V0.0.34
        </span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-[#C5A880]" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#C5A880]">
            MANUAL PRÁTICO DO DIA A DIA
          </span>
        </div>
        <h1 className="font-['Clash_Display'] text-3xl sm:text-4xl font-semibold text-[#F4F4F6] tracking-tight">
          Como usar o Barbosa System
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#A1A1AA] max-w-3xl leading-relaxed">
          Tudo o que você precisa saber para esvaziar a mente, transformar intenções em ações
          estruturadas e manter ritmo de foco profundo. Sem jargões técnicos — apenas tarefas do seu
          dia a dia.
        </p>
      </header>

      {/* CORPO COM SUMÁRIO LATERAL NAVEGÁVEL */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* SUMÁRIO LATERAL (MOBILE / DESKTOP) */}
        <DocSidebar items={TOC_ITEMS} activeId={activeSection} title="Tarefas do dia" />

        {/* CONTEÚDO PRINCIPAL ORGANIZADO POR TAREFA */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* BLOCO 00: COMECE POR AQUI (5 PASSOS ESSENCIAIS) */}
          <section id="comece-aqui" className="scroll-mt-6">
            <div className="p-6 rounded-2xl bg-[#12141C] border border-[#C5A880]/30 shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                  PASSO A PASSO
                </span>
                <span className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider">
                  Primeiros 5 minutos
                </span>
              </div>
              <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6] mb-3">
                Comece por aqui em 5 passos
              </h2>
              <p className="text-sm text-[#A1A1AA] mb-6 leading-relaxed">
                Siga esta sequência simples para entrar no fluxo de produtividade imediatamente:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">01</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Capture uma pendência
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Clique na barra do topo ou aperte o botão{' '}
                    <kbd className="font-mono text-[10px] bg-[#1F2028] px-1 py-0.5 rounded text-[#C5A880]">
                      +
                    </kbd>{' '}
                    no celular.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">02</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Escreva como fala
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Exemplo: <em>"Dentista amanhã às 14:00 p1 @saude"</em>. O sistema entende tudo
                    sozinho.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">03</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Defina o Big3 do dia
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Ordene suas 3 tarefas vitais de Hoje. Elas aparecerão com destaque dourado no
                    topo.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">04</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Ligue o Pomodoro
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Clique no botão de foco de uma tarefa para iniciar o bloco de 25 minutos com som
                    suave.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">05</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Anote o que fez
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Durante a pausa, escreva uma frase curta no campo &quot;O que foi feito?&quot;
                    para registrar seu progresso.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 01: CAPTURAR PENDÊNCIAS */}
          <section id="capturar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">01</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Capturar pendências no momento em que surgem
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Esvazie a mente sem pausar o que você está fazendo
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                A <strong>Barra de Captura</strong> fica permanentemente fixada no topo da
                interface. Você não precisa preencher formulários compridos: basta escrever em
                linguagem natural, como se estivesse mandando uma mensagem para um colega. O sistema
                extrai datas, horários, prioridades e categorias automaticamente, deixando o título
                da tarefa limpo.
              </p>

              {/* TABELA DE ATALHOS DE CAPTURA */}
              <div className="rounded-xl border border-[#27272A] overflow-hidden bg-[#12141C]">
                <div className="p-3.5 bg-[#0E1015] border-b border-[#1F2028]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Tabela Prática: O que você pode digitar na captura
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#27272A] text-[#71717A] font-mono uppercase text-[11px]">
                        <th className="p-3 font-medium">Você digita</th>
                        <th className="p-3 font-medium">O sistema entende</th>
                        <th className="p-3 font-medium">Resultado final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2028]">
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">
                          hoje / amanhã / depois de amanhã
                        </td>
                        <td className="p-3 text-[#E4E4E7]">Agenda para o dia correspondente</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Aparece na visualização Hoje ou Amanhã
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">
                          em 3 dias / daqui a duas semanas
                        </td>
                        <td className="p-3 text-[#E4E4E7]">Calcula a data futura relativa</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Agendado sem você precisar abrir calendário
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">próxima segunda</td>
                        <td className="p-3 text-[#E4E4E7]">Sempre a segunda da próxima semana</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Nunca agenda na semana que já está em curso
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">15/04 ou 15 de abril</td>
                        <td className="p-3 text-[#E4E4E7]">Data exata (assume o ano correto)</td>
                        <td className="p-3 text-[#A1A1AA]">O token é removido do título</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">às 14:00 / 14h / 9h30</td>
                        <td className="p-3 text-[#E4E4E7]">Horário com alerta programável</td>
                        <td className="p-3 text-[#A1A1AA]">Ordena antes de tarefas sem horário</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">
                          p1 / p2 / p3 / p4 ou ! / !!
                        </td>
                        <td className="p-3 text-[#E4E4E7]">
                          Abre popover de prioridade com teclado
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Borda sutil colorida (P1 = ouro champagne)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">@trabalho / @saude</td>
                        <td className="p-3 text-[#E4E4E7]">Atribui etiqueta transversal</td>
                        <td className="p-3 text-[#A1A1AA]">Cria na hora se ainda não existir</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">#projetos / #pessoal</td>
                        <td className="p-3 text-[#E4E4E7]">Vincula à lista correspondente</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Permite agrupar a visualização por lista
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">
                          todo dia / toda semana / todo dia 15
                        </td>
                        <td className="p-3 text-[#E4E4E7]">Recorrência automática de hábito</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Ao concluir, gera a próxima tarefa idêntica
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EXEMPLOS REAIS PRONTOS PARA COPIAR */}
              <div className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] block">
                  Exemplos práticos de digitação (copie e teste na barra):
                </span>
                <CopyableBlock
                  title="Reunião com horário, prioridade e categoria"
                  code="Revisar proposta comercial amanhã às 10:00 p1 @trabalho #vendas"
                />
                <CopyableBlock
                  title="Hábito diário com tempo estimado"
                  code="Ler 15 páginas de livro todo dia às 21:00 25m @desenvolvimento"
                />
                <CopyableBlock
                  title="Compromisso recorrente mensal"
                  code="Emitir notas fiscais e relatórios todo dia 1 p1 #financeiro"
                />
              </div>

              {/* REGRAS IMPORTANTES EM FRASES CURTAS */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-2">
                <strong className="text-xs font-mono uppercase tracking-wider text-[#C5A880] block">
                  Dicas essenciais de captura:
                </strong>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#D4D4D8]">
                  <li>
                    <strong>Tarefas sem data vão para o Inbox:</strong> se você capturar algo sem
                    data, ela ficará guardada na caixa de entrada até você arrastá-la para um dia
                    específico.
                  </li>
                  <li>
                    <strong>Chips visuais editáveis:</strong> ao digitar uma data ou horário, um
                    pequeno chip surge na barra. Clique nele para remover ou alterar antes de
                    apertar Enter.
                  </li>
                  <li>
                    <strong>Tempo previsto:</strong> o seletor ao lado do botão de adicionar ajusta
                    os minutos previstos (padrão 25 min, ajustável de 5 em 5 minutos).
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* TAREFA 02: ORGANIZAR E PRIORIZAR */}
          <section id="organizar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">02</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Organizar o dia e definir o que realmente importa
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Foque nos 20% das ações que entregam 80% dos resultados
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O Barbosa System foi desenhado para eliminar a paralisia por excesso de opções. Em
                vez de uma lista infinita de afazeres, suas pendências são distribuídas por momento
                de execução.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Visões do dia (Hoje, Amanhã, Inbox)
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Hoje:</strong> seu painel de execução principal. Reúne o que está
                      agendado para hoje e tarefas pendentes de dias anteriores (atrasadas).
                    </li>
                    <li>
                      <strong>Amanhã:</strong> preparação rápida ao fim da tarde para começar o
                      próximo dia sem hesitação.
                    </li>
                    <li>
                      <strong>Inbox:</strong> tudo o que você capturou sem definir data. Funciona
                      como triagem.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Metodologia Big3 (80/20)
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Cartão BIG3 no topo:</strong> seleciona as 3 tarefas mais vitais do
                      dia com base em etiquetas fixadas e prioridades P1.
                    </li>
                    <li>
                      <strong>Ponto colorido identificador:</strong> cada tarefa do Big3 mostra a
                      cor da etiqueta de origem.
                    </li>
                    <li>
                      <strong>Selo de conclusão:</strong> ao cumprir as 3 tarefas, um emblema
                      discreto champagne indica que sua missão principal do dia foi batida.
                    </li>
                  </ul>
                </div>
              </div>

              {/* ARRASTAR E SOLTAR + HIERARQUIA */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#C5A880]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Reordenação manual soberana (Arrastar e Soltar)
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Você tem controle total sobre a ordem dos seus afazeres. Arraste qualquer tarefa
                  para cima ou para baixo pelas alças táteis ou pelo corpo do cartão. A ordem que
                  você define é salva instantaneamente e sobrevive ao recarregamento da página.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-2 font-mono">
                  <div className="p-2 rounded bg-[#12141C] border-l-2 border-[#C5A880]">
                    <strong className="text-[#C5A880] block">P1 · Urgente</strong>
                    <span className="text-[11px] text-[#71717A]">Champagne Ouro</span>
                  </div>
                  <div className="p-2 rounded bg-[#12141C] border-l-2 border-[#D8C7B0]">
                    <strong className="text-[#D8C7B0] block">P2 · Alta</strong>
                    <span className="text-[11px] text-[#71717A]">Champagne Claro</span>
                  </div>
                  <div className="p-2 rounded bg-[#12141C] border-l-2 border-[#A1A1AA]">
                    <strong className="text-[#A1A1AA] block">P3 · Média</strong>
                    <span className="text-[11px] text-[#71717A]">Titânio</span>
                  </div>
                  <div className="p-2 rounded bg-[#12141C] border-l-2 border-[#52525B]">
                    <strong className="text-[#A1A1AA] block">P4 · Baixa</strong>
                    <span className="text-[11px] text-[#71717A]">Grafite</span>
                  </div>
                </div>
              </div>

              {/* SUB-TAREFAS COM CHECKLIST */}
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6] mb-2">
                  Subdividir tarefas complexas (Checklist)
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Clique no título de qualquer tarefa para abrir o painel lateral de detalhes. Lá
                  você encontra a seção <strong>Sub-tarefas</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#D4D4D8]">
                  <li>
                    Digite itens rápidos pressionando{' '}
                    <kbd className="font-mono text-[10px] bg-[#1F2028] px-1 py-0.5 rounded text-[#C5A880]">
                      Enter
                    </kbd>{' '}
                    a cada linha.
                  </li>
                  <li>
                    O cartão mostra um indicador compacto de progresso (ex.: <code>2/5</code>) com
                    barra discreta sem poluir a visão.
                  </li>
                  <li>
                    <strong>Autonomia garantida:</strong> concluir uma sub-tarefa não fecha a tarefa
                    principal sem sua ordem. Ao repetir uma tarefa recorrente, a lista de
                    sub-tarefas é reaproveitada limpa para o próximo ciclo.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* TAREFA 03: FOCAR COM POMODORO */}
          <section id="focar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">03</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Executar em blocos de foco com o Pomodoro integrado
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Temporizador com respeito ao seu ritmo, contagem de excesso e sons suaves
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O temporizador do Barbosa System acompanha você em qualquer tela. Não existe
                transição automática agressiva: você decide quando a pausa começa e quando o próximo
                bloco de trabalho se inicia.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <Clock className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Contagem de excesso
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Quando o cronômetro zera, ele toca o som de vitória e continua contando (
                    <code>+00:01</code>, <code>+00:02</code>). Se você estiver embalado, não perde o
                    fluxo.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <Target className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Notas não-bloqueantes
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Durante a pausa ou no widget inferior, responda ao prompt &quot;O que foi
                    feito?&quot;. A anotação é salva no histórico da tarefa e da sessão.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <BookmarkCheck className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Trava entre abas
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Se você abrir o aplicativo em duas abas, apenas uma comanda o cronômetro. As
                    outras espelham o tempo real sem duplicar sessões.
                  </p>
                </div>
              </div>

              {/* COMPARATIVO ESTIMADO VS REAL */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-2">
                <strong className="text-xs font-mono uppercase tracking-wider text-[#C5A880] block">
                  Estimativa vs. Tempo Real:
                </strong>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  Cada tarefa registra quanto tempo você previu (<code>EST. 25 MIN</code>) e quanto
                  tempo realmente dedicou em blocos de foco (<code>REAL 50 MIN</code>). Se você
                  ultrapassar o previsto, uma barra discreta em ouro champagne sinaliza o desvio
                  para ajudá-lo a calibrar futuras estimativas.
                </p>
              </div>
            </div>
          </section>

          {/* TAREFA 04: REVISAR SEMANA E MÉTRICAS */}
          <section id="revisar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">04</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Planejar a semana e acompanhar seu ritmo real
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Planejamento tático de 7 dias e auditoria completa de esforço
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Visão Semana (/semana)
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                    Exibe os próximos 7 dias em colunas completas. No topo, uma faixa com tarefas
                    não agendadas prontas para encaixe.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#D4D4D8]">
                    <li>Arraste uma tarefa entre colunas para reagendá-la na hora.</li>
                    <li>
                      Clique no botão{' '}
                      <kbd className="font-mono text-[10px] bg-[#1F2028] px-1 py-0.5 rounded text-[#C5A880]">
                        +
                      </kbd>{' '}
                      no rodapé de qualquer coluna para capturar já com a data definida.
                    </li>
                    <li>Cada coluna mostra a soma de minutos de trabalho previstos.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Histórico e Marcações de Melhor Dia
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                    Métricas reais calculadas estritamente a partir das suas sessões de foco salvas,
                    sem dados fictícios:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Meta diária por dia da semana:</strong> configure metas diferentes
                      para dias úteis e finais de semana em Configurações.
                    </li>
                    <li>
                      <strong>Cartão Melhor Dia:</strong> identifica seu recorde histórico e avisa
                      quantos minutos faltam hoje para superá-lo.
                    </li>
                    <li>
                      <strong>Selo RECORDE:</strong> barra dourada no gráfico dos últimos 14 dias
                      destacando seu pico de produtividade.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 05: DICAS PARA CELULAR */}
          <section id="dicas-mobile" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">05</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Usando o aplicativo no celular
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Ergonomia para uso com uma mão só e respeito à tela cheia
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                A interface mobile foi projetada com controles ao alcance fácil dos dedos, sem
                rolagem horizontal acidental:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Barra inferior fixa
                  </strong>
                  <p className="text-xs text-[#A1A1AA]">
                    Acesse Hoje, Amanhã, Semana, Pomodoro e Histórico com um único toque.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Botão de captura rápida (+)
                  </strong>
                  <p className="text-xs text-[#A1A1AA]">
                    Botão flutuante acima da barra inferior. Expande na hora para digitar sua
                    pendência.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Gaveta via hambúrguer
                  </strong>
                  <p className="text-xs text-[#A1A1AA]">
                    O menu no canto superior abre todas as suas listas, etiquetas e a caixa de
                    entrada.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RODAPÉ DO GUIA COM LINK PARA DOCUMENTAÇÃO TÉCNICA */}
          <footer className="pt-10 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-[#71717A] uppercase tracking-wider block mb-1">
                Precisa de detalhes técnicos ou integrações?
              </span>
              <p className="text-xs text-[#A1A1AA] m-0">
                Acesse o servidor MCP, schema de dados e arquitetura na documentação técnica.
              </p>
            </div>
            <Link
              to="/dev"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12141C] hover:bg-[#181A22] text-[#C5A880] border border-[#C5A880]/30 hover:border-[#C5A880]/60 text-xs font-mono transition-colors flex-none"
            >
              <span>Ir para /dev (Integradores)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </footer>

          <div className="font-mono text-[11px] text-[#52525B] text-center pt-2">
            Nota: Existe documentação interna da empresa em repositório GitHub privado.
          </div>
        </main>
      </div>
    </div>
  )
}

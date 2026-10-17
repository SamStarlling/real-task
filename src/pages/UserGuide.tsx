import { BrandMark } from '@/components/Brand'
import { CopyableBlock } from '@/components/docs/CopyableBlock'
import { DocSidebar, TocItem, useActiveSection } from '@/components/docs/DocSidebar'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  ListTodo,
  Maximize2,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Target,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_VERSION_LABEL } from '@/lib/version'

const TOC_ITEMS: TocItem[] = [
  { id: 'comece-aqui', num: '00', title: 'Comece por aqui' },
  { id: 'capturar', num: '01', title: 'Capturar pendências' },
  { id: 'estimativa-livre', num: '02', title: 'Estimativa Livre (1–600 min)' },
  { id: 'organizar', num: '03', title: 'Organizar e priorizar' },
  { id: 'projetos', num: '04', title: 'Projetos Todoist & Seções' },
  { id: 'filtros-hub', num: '05', title: 'Etiquetas & Filtros Salvos' },
  { id: 'focar', num: '06', title: 'Focar com Pomodoro' },
  { id: 'revisar', num: '07', title: 'Revisar semana e métricas' },
  { id: 'dicas-mobile', num: '08', title: 'Uso no celular' },
  { id: 'mcp-planejamento', num: '09', title: 'Planejamento via IA (MCP)' },
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
          GUIA DO USUÁRIO · {APP_VERSION_LABEL.toUpperCase()}
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
                        <td className="p-3 font-mono text-[#C5A880]">#projetos / #ciclo12s</td>
                        <td className="p-3 text-[#E4E4E7]">Vincula ao projeto correspondente</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Autocomplete de projetos com objetivos mensuráveis
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
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880]">
                          por 90 min / 1h30 / 45min / 2h
                        </td>
                        <td className="p-3 text-[#E4E4E7]">
                          Duração estimada extraída em linguagem natural
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Preenche a estimativa livre (1–600 min) sem colidir com horários agendados
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
                  title="Reunião com horário, prioridade, projeto e duração em linguagem natural"
                  code="Revisar proposta comercial amanhã às 10:00 por 90 min p1 @trabalho #vendas"
                />
                <CopyableBlock
                  title="Treino com duração composta em horas e minutos"
                  code="Treino de força hoje às 18h por 1h30 @saude"
                />
                <CopyableBlock
                  title="Hábito diário com tempo estimado"
                  code="Ler 15 páginas de livro todo dia às 21:00 45min @desenvolvimento"
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
                    <strong>Chips visuais editáveis:</strong> ao digitar uma data, horário ou
                    duração, um pequeno chip surge na barra. Clique nele para remover ou alterar
                    antes de apertar Enter.
                  </li>
                  <li>
                    <strong>Estimativa Livre e Opcional:</strong> digite qualquer valor de 1 a 600
                    minutos diretamente, use os chips de atalho rápido (5m, 15m, 25m, 45m, 90m) ou
                    escolha "Sem estimativa" para capturas rápidas sem tempo previsto.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* SEÇÃO NOVO: ESTIMATIVA LIVRE (1–600 MIN) */}
          <section id="estimativa-livre" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">02</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Estimativa Livre: 1 a 600 minutos, digitação direta e flexibilidade
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Aposentadoria dos steppers rígidos em favor de autonomia real de calibração
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O Barbosa System substituiu os antigos controles engessados (steppers de 5 em 5
                minutos com teto de 240 minutos e o seletor restrito a 4 opções: 15/25/50/90) pelo
                componente padronizado <strong>EstimateInput</strong>. Agora você tem liberdade
                total para digitar qualquer duração de{' '}
                <strong>1 a 600 minutos (até 10 horas)</strong> ou deixar a tarefa livre sem
                estimativa.
              </p>

              {/* GRID COM OS 4 PILARES DA ESTIMATIVA LIVRE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Digitação Livre e Onipresente
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    O campo numérico aceita digitação direta em todos os pontos do sistema onde
                    tarefas são criadas ou editadas:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Barra de captura rápida</strong> fixada no topo;
                    </li>
                    <li>
                      <strong>Painel de detalhe da tarefa (TaskDetail)</strong> ao clicar no card;
                    </li>
                    <li>
                      <strong>Visão Semana (/semana)</strong> na captura rápida de cada coluna de
                      dia;
                    </li>
                    <li>
                      <strong>Captura inline nas seções de projeto</strong> em{' '}
                      <code>/projetos/:id</code>.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Chips de Atalho & Sem Estimativa
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    Para agilidade máxima sem perder a digitação livre, o componente oferece botões
                    de 1 toque:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Chips rápidos:</strong> <code>5m</code>, <code>15m</code>,{' '}
                      <code>25m</code>, <code>45m</code> e <code>90m</code>;
                    </li>
                    <li>
                      <strong>Opção "Sem estimativa":</strong> zera o campo com 1 clique para
                      tarefas que não precisam de tempo pré-fixado;
                    </li>
                    <li>
                      <strong>Incremento/decremento fino:</strong> botões <code>-</code> e{' '}
                      <code>+</code> ajustam o valor mantendo foco ativo.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Duração em Linguagem Natural
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    Você pode incluir a duração diretamente no texto durante a captura. O parser
                    inteligente reconhece formatos variados sem colidir com horários agendados:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#D4D4D8]">
                    <li>
                      <code>por 90 min</code> ou <code>durante 45 min</code> &rarr; 90 ou 45
                      minutos;
                    </li>
                    <li>
                      <code>1h30</code> ou <code>por 1h30</code> &rarr; 90 minutos;
                    </li>
                    <li>
                      <code>2h</code>, <code>3h</code> ou <code>durante 2 horas</code> &rarr; 120 ou
                      180 minutos;
                    </li>
                    <li>
                      <strong>Proteção contra horários:</strong> <em>"às 9h30"</em> ou{' '}
                      <em>"14:00"</em> viram alarme/horário agendado, não duração estimada.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Estimativa Opcional & Tratamento na UI
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    Tarefas criadas na Inbox ou pelo fluxo rápido não precisam obrigatoriamente de
                    estimativa:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#D4D4D8]">
                    <li>
                      Tarefas sem estimativa guardam <code>null</code> ou <code>0</code> no
                      PocketBase;
                    </li>
                    <li>
                      Nos cartões, a tag exibe <code>EST. —</code> de forma limpa e discreta;
                    </li>
                    <li>
                      O comparativo <strong>Previsto × Real</strong> exibe traço neutro em vez de
                      barras infladas ou distorcidas;
                    </li>
                    <li>
                      Você pode calibrar a estimativa mais tarde pelo painel de detalhe sempre que
                      quiser.
                    </li>
                  </ul>
                </div>
              </div>

              {/* AVISO CHAMPAGNE > 90 MIN */}
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40 relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#C5A880]/15 text-[#C5A880] flex-none mt-0.5 border border-[#C5A880]/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-xs font-mono uppercase tracking-wider text-[#C5A880] block">
                      Aviso sutil para tarefas longas (&gt; 90 min)
                    </strong>
                    <p className="text-xs text-[#E4E4E7] leading-relaxed">
                      Ao definir uma estimativa superior a 90 minutos, um alerta champagne discreto
                      é exibido abaixo do campo:{' '}
                      <em className="text-[#C5A880]">
                        &quot;90+ min? Considere quebrar a tarefa em partes menores&quot;
                      </em>
                      .
                    </p>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      O aviso não impede o salvamento nem bloqueia sua ação — é um lembrete
                      ergonômico de decomposição tática: tarefas menores reduzem procrastinação e
                      facilitam o ritmo de blocos Pomodoro focados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 03: ORGANIZAR E PRIORIZAR */}
          <section id="organizar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">03</span>
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

              {/* DESCRIÇÃO DA TAREFA & LINKS CLICÁVEIS (ETAPA 1.5 TODOIST) */}
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                    NOVO NO PAINEL
                  </span>
                  <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                    Descrição da Tarefa: Vínculo Obsidian, Cursos & Links Clicáveis
                  </h3>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Clique em qualquer tarefa para abrir a gaveta lateral de detalhes. Agora você
                  conta com o campo <strong>DESCRIÇÃO</strong>, indispensável para manter contexto
                  rico sem poluir o título:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">🔗 Links Obsidian Diretos</strong>
                    <span className="text-[#A1A1AA]">
                      Cole links do tipo <code>obsidian://open?vault=...</code> ou notas de cursos.
                      Eles são detectados automaticamente e abrem direto no app do Obsidian com 1
                      clique.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">
                      🌐 Referências & Links Web
                    </strong>
                    <span className="text-[#A1A1AA]">
                      Qualquer link <code>https://</code> ou <code>http://</code> (aulas,
                      dashboards, docs) vira link clicável seguro que abre em nova aba.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">
                      📁 Projeto & Prazo Integrados
                    </strong>
                    <span className="text-[#A1A1AA]">
                      No topo da gaveta, visualize e edite o Projeto associado (com dot de cor) e o
                      Prazo em uma única linha limpa e sem atrito.
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#D4D4D8]">
                  <strong>Edição ágil:</strong> digite livremente com suporte a quebras de linha.
                  Para salvar, basta clicar fora (salva em blur), pressionar{' '}
                  <kbd className="font-mono text-[10px] bg-[#1F2028] px-1 py-0.5 rounded text-[#C5A880]">
                    Ctrl+Enter
                  </kbd>{' '}
                  ou clicar no botão Salvar. A captura rápida continua rápida e leve sem campos
                  adicionais.
                </p>
              </div>

              {/* SUB-TAREFAS COM CHECKLIST */}
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6] mb-2">
                  Subdividir tarefas complexas (Checklist)
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  No mesmo painel lateral de detalhes, logo abaixo da descrição, você encontra a
                  seção <strong>Sub-tarefas</strong>:
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

          {/* TAREFA 04: PROJETOS TODOIST & SEÇÕES */}
          <section id="projetos" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">04</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Projetos Todoist: Ciclos de 12 Semanas, Recorrentes e Seções
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Organização por objetivos mensuráveis, áreas de trabalho e calibração de prazo
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O modelo de projetos do Barbosa System une a flexibilidade hierárquica do Todoist
                com a precisão de metas de longo prazo. Você pode estruturar seu trabalho em dois
                pilares:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6] mb-2">
                    1. Projetos &quot;Ciclo&quot; de 12 Semanas
                  </h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    Projetos com <strong>Objetivo Mensurável</strong> definido previamente (ex.:{' '}
                    <em>&quot;Faturar R$10k em 12 semanas&quot;</em>) e vínculo direto com sua pasta
                    do Obsidian (<code>obsidian://</code>).
                  </p>
                  <p className="text-xs text-[#D4D4D8]">
                    Dentro dele, utilize <strong>Seções</strong> para representar suas frentes e
                    áreas de atuação: <em>Saúde</em>, <em>Desenvolvimento / Sistemas</em> e{' '}
                    <em>Prospecção de Clientes</em>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6] mb-2">
                    2. Projetos &quot;Recorrentes&quot;
                  </h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    Projetos para hábitos e rotinas de frequência fixa (treinar seg/qua/sex,
                    prospectar 10 contatos/dia, ler 30 min).
                  </p>
                  <p className="text-xs text-[#D4D4D8]">
                    Organizados por seções de periodicidade: <em>Diário</em>, <em>Semanal</em> e{' '}
                    <em>Mensal</em>.
                  </p>
                </div>
              </div>

              {/* RECURSOS DOS PROJETOS */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block font-bold">
                  Recursos em /projetos e /projetos/:id:
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#D4D4D8]">
                  <li>
                    <strong>Resumo Estimado × Real:</strong> calibração de prazo em tempo real
                    somando os minutos previstos das tarefas vs. o tempo real registrado nas sessões
                    Pomodoro.
                  </li>
                  <li>
                    <strong>Links Obsidian & Web:</strong> descrições com links no formato{' '}
                    <code>obsidian://open?vault=...</code> ou web abrem diretamente no seu
                    aplicativo Obsidian ou navegador.
                  </li>
                  <li>
                    <strong>Seções & Drag-and-Drop:</strong> crie seções personalizadas, reordene
                    tarefas e mova pendências entre seções arrastando os cartões.
                  </li>
                  <li>
                    <strong>Projetos Favoritos:</strong> projetos favoritados ganham selo dourado e
                    aparecem na seção FAVORITOS unificada no topo da sidebar ao lado de etiquetas
                    prioritárias.
                  </li>
                  <li>
                    <strong>Sub-projetos Aninhados:</strong> organize projetos em árvores
                    hierárquicas com chevron de expandir/recolher e indentação clara na sidebar.
                  </li>
                  <li>
                    <strong>Menu de Ações Rápidas:</strong> passe o mouse sobre qualquer projeto na
                    sidebar para fixar/desafixar dos favoritos, renomear ou arquivar em 1 clique.
                  </li>
                  <li>
                    <strong>Segurança de Dados:</strong> caso exclua um projeto, todas as tarefas
                    vinculadas voltam em segurança para a Inbox.
                  </li>
                </ul>
              </div>

              {/* REESTRUTURAÇÃO DA SIDEBAR (ETAPA 2 TODOIST) */}
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                    NOVA SIDEBAR TODOIST
                  </span>
                  <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                    Navegação Hierárquica em 4 Seções Colapsáveis
                  </h3>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  A barra lateral do desktop e o drawer mobile foram totalmente reconstruídos no
                  padrão Todoist, mantendo a identidade <em>dark & champagne</em> (#090A0E /
                  #C5A880):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">1. Visões</strong>
                    <span className="text-[#A1A1AA]">
                      Hoje, Amanhã, Semana e Inbox com contagens de tarefas abertas à direita em
                      Space Mono e estado colapsável.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">2. Favoritos</strong>
                    <span className="text-[#A1A1AA]">
                      Área nobre com projetos favoritos e etiquetas prioritárias unificados com
                      contagem somada.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">3. Projetos</strong>
                    <span className="text-[#A1A1AA]">
                      Dot colorido, suporte a subprojetos aninhados, reordenação e link de acesso
                      rápido para gerenciar.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#C5A880] block mb-1">4. Etiquetas</strong>
                    <span className="text-[#A1A1AA]">
                      Paleta sóbria, filtro ágil de visualização e reordenação com persistência
                      direta no PocketBase.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 05: ETIQUETAS & FILTROS SALVOS (ETAPA 3 TODOIST) */}
          <section id="filtros-hub" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">05</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Hub de Etiquetas & Filtros Salvos Guiados
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Gestão centralizada de vocabulário e criação de visões dinâmicas personalizadas
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O <strong>Hub de Etiquetas & Filtros Salvos (/filtros)</strong> é a central de
                inteligência visual do Barbosa System. Em vez de exigir o aprendizado de comandos de
                busca complexos, o sistema adota <strong>combinações guiadas de 5 critérios</strong>{' '}
                (período, prioridade, etiqueta, projeto e estado), permitindo salvar visões sob
                demanda e fixá-las na sidebar.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Gestão Soberana de Etiquetas
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Visão consolidada:</strong> veja todas as suas etiquetas com contagem
                      de tarefas abertas e cor personalizada da paleta quiet luxury.
                    </li>
                    <li>
                      <strong>Edição inline:</strong> renomeie etiquetas e altere sua cor de
                      destaque sem perder tarefas associadas.
                    </li>
                    <li>
                      <strong>Mesclagem de etiquetas:</strong> mova todas as tarefas de uma etiqueta
                      para outra existente em 1 clique com exclusão limpa da etiqueta de origem.
                    </li>
                    <li>
                      <strong>Exclusão segura:</strong> ao excluir uma etiqueta, suas tarefas são
                      preservadas intactas e a referência é desvinculada automaticamente.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-['Clash_Display'] text-base font-semibold text-[#F4F4F6]">
                      Filtros Salvos como Visões Dinâmicas
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-[#D4D4D8]">
                    <li>
                      <strong>Combinações guiadas:</strong> filtre por período (Hoje, Amanhã, Esta
                      semana, Atrasadas, Sem data), prioridade (P1–P4), etiqueta, projeto e estado.
                    </li>
                    <li>
                      <strong>Atalhos de 1 clique:</strong> crie visões instantâneas como
                      "Atrasadas", "Hoje & P1 Urgente" e "Sem data & Sem etiqueta" para triagem
                      rápida.
                    </li>
                    <li>
                      <strong>Fixação na Sidebar:</strong> clique no ícone de alfinete (Pin) para
                      fixar o filtro na seção FAVORITOS da barra lateral e drawer móvel.
                    </li>
                    <li>
                      <strong>Visualizador dedicado:</strong> abra qualquer filtro para navegar
                      pelas tarefas com cards completos, ações de conclusão, detalhes e edição.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 06: FOCAR COM POMODORO */}
          <section id="focar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">06</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <Maximize2 className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Modo Foco em Tela Cheia
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Clique no timer central em <code>/pomodoro</code> ou no botão{' '}
                    <em>"Foco em tela cheia"</em> para entrar no modo 100% imersivo: fundo escuro
                    absoluto (#090A0E), timer gigante em Clash Display, âncora do objetivo visível e
                    atalho <strong>Esc</strong> para sair.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <Clock className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Modo Stopwatch & Pomo
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Escolha entre o tradicional Pomodoro regressivo (com contagem de excesso{' '}
                    <code>+00:01</code>) ou o modo <strong>Stopwatch</strong> (contagem crescente
                    contínua para imersão sem tempo limite pré-fixado).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <Target className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Objetivo do Bloco & Veredito
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Defina um objetivo antes de iniciar (âncora anti-drift visível). No encerramento
                    (natural, manual ou no Stopwatch), avalie em 1 toque: <strong>Batido</strong>,{' '}
                    <strong>Parcial</strong> ou <strong>Não foi</strong>, e anote o que foi feito e
                    o que fica pendente.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <BookmarkCheck className="w-5 h-5 text-[#C5A880] mb-2" />
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Duração Livre & Presets
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Ajuste tempos de 1 em 1 minuto diretamente pelos steppers ou digitando. Crie
                    novos presets personalizados a partir da duração atual, edite nomes e durações
                    ou arquive com facilidade.
                  </p>
                </div>
              </div>

              {/* COMPARATIVO ESTIMADO VS REAL */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-2">
                <strong className="text-xs font-mono uppercase tracking-wider text-[#C5A880] block">
                  Estimativa Livre vs. Tempo Real:
                </strong>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  Cada tarefa pode registrar quanto tempo você previu (ex: <code>EST. 45 MIN</code>)
                  e quanto tempo realmente dedicou em blocos de foco (<code>REAL 50 MIN</code>). Se
                  você ultrapassar o previsto, uma barra discreta em ouro champagne sinaliza o
                  desvio para ajudá-lo a calibrar futuras estimativas.
                </p>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Caso crie uma tarefa sem estimativa (opcional na Inbox), o cartão exibe{' '}
                  <code>EST. —</code> e o comparativo apresenta um traço limpo sem distorcer as
                  barras de progresso.
                </p>
              </div>

              {/* ESTATÍSTICAS DE FOCO & FILTROS NA TIMELINE (NOVO ETAPA 4) */}
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Estatísticas de Foco & Filtros na Timeline
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Na tela <strong>/pomodoro</strong>, para evitar excesso de informação e permitir
                  que a página respire, a <strong>Visão geral e Estatísticas</strong> está reunida
                  em um painel colapsável inteligente com abas <em>Resumo Geral</em> e{' '}
                  <em>Distribuição & Donut</em>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#F4F4F6] block mb-1">Painel Unificado & Abas</strong>
                    <span className="text-[#A1A1AA]">
                      Inicia recolhido automaticamente quando o timer entra em foco e aberto quando
                      ocioso. Alterna entre os 4 cartões consolidados e o Donut com 1 toque.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#F4F4F6] block mb-1">Donut & Disciplina</strong>
                    <span className="text-[#A1A1AA]">
                      Top 5 tarefas + Outras em paleta champagne harmônica. Clique em qualquer fatia
                      para selecionar a tarefa para foco, acompanhando média e % de objetivos
                      batidos.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090A0E] border border-[#27272A]">
                    <strong className="text-[#F4F4F6] block mb-1">Filtros Combinados</strong>
                    <span className="text-[#A1A1AA]">
                      Filtre a timeline por período (Hoje, 7d, 30d, Tudo), por tarefa específica e
                      por status (completas ou interrompidas), com botão rápido de limpar.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 07: REVISAR SEMANA E MÉTRICAS */}
          <section id="revisar" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">07</span>
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

              {/* RELATÓRIO SEMANAL DE FOCO (NOVO) */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Relatório Semanal de Foco (Aba no Histórico)
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Dentro de <strong>Histórico</strong>, acesse a aba{' '}
                  <strong className="text-[#C5A880]">RELATÓRIO SEMANAL</strong> para auditar seu
                  esforço:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-[#12141C] border border-[#27272A]">
                    <strong className="text-[#F4F4F6] block mb-1">Cruzamento Diário</strong>
                    <span className="text-[#A1A1AA]">
                      Para cada dia da semana (segunda a domingo), barra visual de foco real vs.
                      meta configurada. A barra acende em ouro champagne quando o objetivo é
                      alcançado.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#12141C] border border-[#27272A]">
                    <strong className="text-[#F4F4F6] block mb-1">Deltas & Picos</strong>
                    <span className="text-[#A1A1AA]">
                      Comparativo em tempo real com a semana anterior (delta de horas e percentual),
                      dias cumpridos (ex.: 4/5 dias) e o dia com maior dedicação.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#12141C] border border-[#27272A]">
                    <strong className="text-[#F4F4F6] block mb-1">Navegação Temporal</strong>
                    <span className="text-[#A1A1AA]">
                      Consulte qualquer semana passada usando os botões de navegação, com estados
                      vazios limpos e sem mocks quando não houver sessões registradas.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 08: DICAS PARA CELULAR */}
          <section id="dicas-mobile" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">08</span>
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
                    O menu no canto superior abre a navegação completa idêntica ao desktop: Visões,
                    Favoritos, Projetos e Etiquetas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* TAREFA 09: PLANEJAMENTO MASSIVO VIA MCP (LLM) */}
          <section id="mcp-planejamento" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">09</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Planejamento Massivo via IA (Servidor MCP com Claude & Gemini)
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Conecte seu modelo de linguagem favorito para gerenciar projetos, seções,
                  descrições ricas e filtros salvos
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                No Barbosa System, o planejamento de rotinas, projetos e blocos não precisa ser
                feito manualmente clique a clique na tela. Com a{' '}
                <strong>Etapa 3 do Servidor MCP</strong>, você conecta modelos como{' '}
                <strong>Claude Desktop</strong> ou <strong>Gemini</strong> diretamente ao seu
                backend para orquestrar tarefas com profundidade executiva:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    Projetos & Seções em Lote
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    Peça ao LLM para criar um Ciclo de 12 Semanas com meta mensurável e frentes de
                    trabalho estruturadas em seções (ex.: <em>Saúde</em>, <em>Sistemas</em>,{' '}
                    <em>Prospecção</em>). O MCP cria o projeto e distribui tarefas nas seções
                    automaticamente.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-2 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#C5A880]" />
                    Filtros Salvos & Visões Dinâmicas
                  </strong>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">
                    O LLM pode criar e fixar filtros salvos na sua barra lateral nos 5 eixos guiados
                    (ex.: <em>Atrasadas & P1</em>, <em>Revisão Semanal</em>) e rodar auditorias
                    pontuais para identificar gargalos.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-2">
                <strong className="text-xs font-mono uppercase tracking-wider text-[#C5A880] block">
                  Capacidades da Etapa 3 MCP para o seu Copiloto de Produtividade:
                </strong>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#D4D4D8]">
                  <li>
                    <strong>Descrição com Contexto Rico:</strong> o LLM anota notas técnicas,
                    checklists e links para seus vaults no Obsidian (<code>obsidian://</code>) no
                    campo de descrição das tarefas (até 5000 caracteres).
                  </li>
                  <li>
                    <strong>Veredito do Bloco Pomodoro:</strong> registre sessões de foco pelo chat
                    do LLM avaliando se o objetivo do bloco foi <em>batido</em>, <em>parcial</em> ou{' '}
                    <em>não foi</em>, com quebra de tempo por tarefa no gráfico Donut.
                  </li>
                  <li>
                    <strong>Mesclagem de Etiquetas:</strong> solicite a unificação de etiquetas
                    duplicadas pelo chat (ex.: mesclar <code>@dev</code> em <code>@sistemas</code>)
                    preservando tarefas intactas.
                  </li>
                </ul>
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

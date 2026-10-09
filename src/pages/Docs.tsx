import { BrandMark } from '@/components/Brand'

export function Docs() {
  return (
    <div className="page docs-page">
      <header className="view-title">
        <div>
          <span className="eyebrow">DOCUMENTAÇÃO DO SISTEMA</span>
          <h1 className="docs-heading">Barbosa System</h1>
        </div>
        <span className="docs-badge">VERSÃO INTERNA · V1.0 · MCP ETAPA 1</span>
      </header>

      <p className="docs-intro">
        O <strong>Barbosa System</strong> é uma plataforma minimalista de alto desempenho voltada à
        captura instantânea de tarefas, priorização diária e execução focada com temporizador
        Pomodoro integrado. Projetado com estética <em>quiet luxury</em>, tempo real bidirecional,
        servidor MCP oficial (JSON-RPC 2.0 / Streamable HTTP) e dados 100% persistidos e isolados
        por usuário.
      </p>

      {/* ÍNDICE RÁPIDO */}
      <nav className="mb-8 p-3.5 bg-[#121214] border border-[#27272A] rounded-md flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono">
        <span className="text-[#71717A] tracking-wider uppercase">SEÇÕES:</span>
        <a
          href="#funcionalidades"
          className="text-[#A1A1AA] hover:text-[#C5A880] transition-colors"
        >
          01. Funcionalidades
        </a>
        <a href="#ferramentas" className="text-[#A1A1AA] hover:text-[#C5A880] transition-colors">
          02. Ferramentas & Atalhos
        </a>
        <a href="#design-system" className="text-[#A1A1AA] hover:text-[#C5A880] transition-colors">
          03. Design System
        </a>
        <a href="#banco-de-dados" className="text-[#A1A1AA] hover:text-[#C5A880] transition-colors">
          04. Banco & Schema PB
        </a>
        <a
          href="#conectar-agentes-mcp"
          className="text-[#C5A880] font-semibold hover:underline transition-colors"
        >
          05. Conectar Agentes (MCP)
        </a>
      </nav>

      {/* SEÇÃO 1: FUNCIONALIDADES */}
      <section className="docs-section" id="funcionalidades">
        <div className="docs-section-header">
          <span className="docs-section-num">01</span>
          <div>
            <h2>Funcionalidades do Aplicativo</h2>
            <p>Módulos de produtividade e controle operacional do usuário</p>
          </div>
        </div>

        <div className="docs-grid">
          <article className="docs-card">
            <h3>Captura Rápida com PNL em Português</h3>
            <p>
              Barra fixa no topo da interface com interpretação de linguagem natural em tempo real:
            </p>
            <ul>
              <li>
                <strong>Datas relativas e futuras:</strong> reconhecimento abrangente de expressões
                como <code>hoje</code>, <code>amanhã</code>, <code>depois de amanhã</code>,
                intervalos relativos como <code>em 3 dias</code>, <code>daqui a duas semanas</code>,
                saltos de semana como <code>próxima segunda</code> (projetada impreterivelmente para
                a semana seguinte, nunca a atual) e datas explícitas futuras nos formatos{' '}
                <code>12/11</code> (com ano automático) e <code>15 de novembro</code>. O token é
                extraído e removido do título da tarefa.
              </li>
              <li>
                <strong>Recorrência em linguagem natural:</strong> detecção pura de repetições em
                português do Brasil diretamente pelo texto, como <code>todo dia</code> (diária),{' '}
                <code>toda semana</code> (semanal), <code>toda segunda</code> ou{' '}
                <code>toda terça e quinta</code> (semanal com dias específicos),{' '}
                <code>todos os dias úteis</code> e <code>todo dia 15</code> (mensal no dia fixo
                indicado, sem ambiguidade com diária). As expressões saem do título, configuram os
                parâmetros de repetição da tarefa e geram chip editável com botão de remoção na
                barra.
              </li>
              <li>
                <strong>Combinação fluida com horário:</strong> frases como{' '}
                <em>&quot;Ler 10 páginas todo dia às 10:00&quot;</em> geram a tarefa com título
                limpo <em>&quot;Ler 10 páginas&quot;</em>, recorrência diária e horário{' '}
                <code>10:00</code>. Analogamente, <em>&quot;dentista 20/11 às 9h30&quot;</em> agenda
                a data e o horário sem poluir o nome da tarefa.
              </li>
              <li>
                <strong>
                  Autocomplete ativo de Prioridade (<code>p1–p4</code> e <code>!</code>):
                </strong>{' '}
                ao digitar <code>p1</code>–<code>p4</code> ou <code>!</code>/<code>!!</code> na
                barra de captura, abre-se instantaneamente o popover contextual com opções P1–P4
                (rótulo, cor oficial e descrição curta, ex. &quot;P1 · Urgente&quot;). Navegação por
                teclado (setas + Enter/Esc) ou clique aplica a prioridade imediatamente, extrai o
                token do título e adiciona o chip visual.
              </li>
              <li>
                <strong>
                  Organização por listas via <code>#</code>:
                </strong>{' '}
                menu suspenso contextual com filtro dinâmico de listas existentes e opção
                instantânea de criar nova lista ao digitar.
              </li>
              <li>
                <strong>
                  Categorização rápida por etiquetas via <code>@</code>:
                </strong>{' '}
                digitar <code>@</code> abre autocomplete instantâneo de etiquetas do usuário com
                busca em tempo real, suporte a criação imediata ao pressionar Enter e atribuição
                automática da próxima cor discreta da paleta da casa (Champagne Ouro, Verde-Oliva,
                Azul-Ardósia, Terracota, Vinho, Cinza-Azulado, etc.). As tags são removidas do
                título capturado e persistidas na relação da tarefa.
              </li>
              <li>
                <strong>Seletor de minutos previstos:</strong> controle de passo (stepper) ajustável
                em intervalos de 5 min (mínimo 5 min, padrão 25 min, máximo 240 min).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Visões Temporais & Arrastar-e-Soltar</h3>
            <p>
              Navegação rigorosamente ordenada por fluxo cognitivo de execução com reordenação
              fluida:
            </p>
            <ul>
              <li>
                <strong>Reordenamento por Arrastar-e-Soltar (Drag & Drop):</strong> organização
                intuitiva da prioridade de execução nas visões Hoje, Amanhã e Inbox. Ao arrastar
                pela alça sutil em traço fino ou pelo corpo do cartão, o usuário reordena as tarefas
                pendentes com feedback visual <em>quiet luxury</em> (elevação suave, contorno ouro
                champagne fosco e indicador sutil de drop target). Suporta mouse e toque em telas
                sensíveis (mobile).
              </li>
              <li>
                <strong>Persistência Real no Banco:</strong> o campo sequencial <code>order</code>{' '}
                na coleção <code>tasks</code> garante que a ordem personalizada sobrevive a
                recarregamentos de página e se propaga instantaneamente para outras abas e
                dispositivos via SSE Realtime. A reordenação não afeta datas, status ou tempos reais
                das tarefas.
              </li>
              <li>
                <strong>Inbox:</strong> todas as tarefas capturadas sem data de vencimento
                atribuída. Serve como triagem primária de pendências priorizáveis por arrasto.
              </li>
              <li>
                <strong>Hoje:</strong> visão principal do app. Agrupa tarefas agendadas para o dia e
                itens pendentes de dias anteriores (atrasadas). Inclui o indicador e barra de
                progresso <code>FOCO HOJE</code> (tempo real acumulado vs. tempo total estimado).
              </li>
              <li>
                <strong>Amanhã:</strong> preparação e visualização prévia da carga de trabalho do
                dia seguinte com ordem de ataque matinal customizada.
              </li>
              <li>
                <strong>Visão Semana (/semana):</strong> planejamento tático dos 7 dias corridos
                (hoje + 6 dias subsequentes) em grade desktop fluida ou seções empilhadas no mobile.
                Apresenta cabeçalhos em Space Mono com a data, dia da semana e carga consolidada
                (tarefas e minutos estimados), destaque sutil na coluna de hoje e totalizadores no
                topo. Inclui faixa horizontal de Inbox com tarefas sem data prontas para agendamento
                por arrastar-e-soltar, reagendamento imediato entre dias ao soltar em outra coluna
                (persistindo <code>due_date</code> e <code>order</code> no PocketBase) e botão
                discreto "+" no rodapé de cada coluna para captura inline pré-preenchida para a data
                específica.
              </li>
              <li>
                <strong>Filtro por Etiquetas em Todas as Visões:</strong> fileira discreta de chips
                no topo das visões Hoje, Amanhã, Inbox e Semana. Exibe somente as etiquetas que
                possuem tarefas ativas naquela visualização com contador; clicar em um chip filtra a
                lista instantaneamente e clicar novamente ou no botão &quot;Limpar filtro&quot;
                restaura a visualização integral sem recarregar a tela.
              </li>
              <li>
                <strong>Agrupamento nas Visões Hoje e Amanhã (TickTick / Todoist):</strong> seletor
                discreto no cabeçalho das visões Hoje e Amanhã permitindo alternar instantaneamente
                entre <code>PADRÃO</code> (lista contínua), <code>ETIQUETA</code> (agrupamento por
                @tag com ponto de cor) ou <code>LISTA</code> (agrupamento por #lista). Cada grupo
                conta com cabeçalho colapsável em Space Mono com contador de tarefas e transição
                fluida, agrupando pendências sem atributos no bloco final (<code>SEM ETIQUETA</code>{' '}
                / <code>SEM LISTA</code>). A preferência de agrupamento é persistida por visão no
                armazenamento local do usuário. O drag-and-drop de reordenação manual (campo{' '}
                <code>order</code>) continua integralmente funcional dentro de cada grupo e, no
                agrupamento por lista, arrastar um cartão para o grupo de outra lista reatribui a
                lista da tarefa em tempo real com sincronização no banco.
              </li>
              <li>
                <strong>Histórico com Marcações de Melhor Dia & Recordes:</strong> registro
                auditável de esforço completo com marcas discretas de recorde (<em>quiet luxury</em>
                ). Cartão dedicado <code>MELHOR DIA</code> no topo comparando o foco acumulado de
                hoje com o recorde absoluto histórico do usuário (com badge{' '}
                <code>HOJE É O RECORDE</code> ou o déficit pontual <code>FALTAM X MIN</code>),
                destaque champagne refinado na barra do melhor dia no gráfico de 14 dias com chip{' '}
                <code>RECORDE</code>, insígnia sutil nos cabeçalhos de datas recordistas na timeline
                e linha comparativa com o mesmo dia da semana (média e recorde para segundas, terças
                etc.).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Prioridades P1–P4 (Modelo TickTick / Quiet Luxury)</h3>
            <p>
              Hierarquia visual de priorização em 4 níveis sóbrios, sem poluição visual ou cores
              neon:
            </p>
            <ul>
              <li>
                <strong>Níveis de prioridade calibrados:</strong> <code>P1 (Urgente)</code> com
                borda esquerda 3px em Champagne Ouro Fosco (<code>#C5A880</code>, reservado ao mais
                urgente); <code>P2 (Alta)</code> em Champagne Claro (<code>#D8C7B0</code>);{' '}
                <code>P3 (Média)</code> em Titânio (<code>#A1A1AA</code>); e <code>P4 (Baixa)</code>{' '}
                em Grafite Sutil (<code>#52525B</code>). Tarefas sem prioridade permanecem com a
                borda sutil padrão.
              </li>
              <li>
                <strong>Indicador discreto no cartão:</strong> chip tipográfico em Space Mono
                uppercase 10px <code>P1</code>–<code>P4</code> posicionado junto aos metadados
                (listas, tags e horários), reforçando a identificação rápida sem ruído cognitivo.
              </li>
              <li>
                <strong>Preservação da Soberania da Ordem Manual:</strong> a prioridade funciona
                como indicador visual claro, mas <em>não sequestra a ordenação manual</em> da lista
                (drag-and-drop e campo <code>order</code> continuam soberanos dentro de cada grupo),
                garantindo liberdade tática ao usuário ao planejar seu dia sem rearranjos
                indesejados.
              </li>
              <li>
                <strong>Seletor no painel de detalhes:</strong> seção dedicada{' '}
                <code>PRIORIDADE</code> no drawer da tarefa com pílulas táteis (P1, P2, P3, P4 e
                Nenhuma) com ativação em Champagne Ouro e sincronização em tempo real.
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Horário de Tarefas e Alertas (Etapa 3)</h3>
            <p>
              Agendamento horário e sistema de lembretes em dois níveis (in-app e navegador) com
              estética <em>quiet luxury</em>:
            </p>
            <ul>
              <li>
                <strong>
                  Campo <code>due_time</code>:
                </strong>{' '}
                horário opcional em formato HH:MM (ex.: "14:00", "09:30") persistido no banco de
                dados e exibido em fonte Space Mono uppercase ao lado de estimativas e etiquetas.
              </li>
              <li>
                <strong>Ordenação estrita por hora:</strong> dentro de um mesmo dia (visões Hoje,
                Amanhã e colunas da Semana), tarefas <em>com horário</em> ordenam prioritariamente
                antes das tarefas sem horário, com desempate por hora cronológica e preservação do
                campo <code>order</code> manual como critério secundário.
              </li>
              <li>
                <strong>Captura inteligente em português:</strong> a barra de captura reconhece
                expressões naturais como <code>reunião 14:00</code>, <code>dentista às 9h30</code>,{' '}
                <code>treino 7h</code>, preenchendo automaticamente <code>due_time</code> com chip
                visual e botão de remoção rápida.
              </li>
              <li>
                <strong>Marcação visual de atrasadas:</strong> tarefas cujo horário de vencimento
                tenha passado no dia de hoje (ou em datas passadas) recebem contorno e badge em tom
                terracota quente da casa (<code>#B37D6B</code>), mantendo a sobriedade sem cores
                neon.
              </li>
              <li>
                <strong>Lembrete In-App na visão Hoje:</strong> banner discreto no topo da visão
                Hoje listando as próximas tarefas do dia e pendências atrasadas com atualização a
                cada minuto, sem depender de permissões do navegador.
              </li>
              <li>
                <strong>Notificações do Navegador & Som Web Audio:</strong> avisos nativos via
                Notification API quando o app está aberto na aba, com antecedência configurável (na
                hora exata, 5, 10 ou 15 min antes), acorde sonoro suave e preferências salvas no
                perfil do usuário (<code>notification_preferences</code>).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Recorrência de Tarefas (Estilo TickTick)</h3>
            <p>
              Mecanismo robusto de hábitos e tarefas periódicas com criação automática da próxima
              instância:
            </p>
            <ul>
              <li>
                <strong>Seletor completo de repetição:</strong> configurável no painel lateral de
                detalhes e acessível rapidamente via botão de repetição na barra de captura do topo.
                Suporta quatro modalidades: <code>Diária</code> (a cada N dias),{' '}
                <code>Dias da semana</code> (multi-seleção Seg–Dom, a cada N semanas),{' '}
                <code>Semanal</code> (a cada N semanas no mesmo dia da semana) e <code>Mensal</code>{' '}
                (dia fixo do mês com clamp inteligente para o último dia de meses curtos).
              </li>
              <li>
                <strong>Dois modos de base de cálculo:</strong> <code>A partir da data</code> (a
                próxima data é computada rigidamente a partir do prazo original — ideal para
                vencimentos e compromissos) e <code>A partir da conclusão</code> (a próxima data
                avança a partir do momento em que você marca a tarefa como feita — ideal para
                rotinas flexíveis, cuidados e hábitos).
              </li>
              <li>
                <strong>Criação automática ao concluir:</strong> ao marcar a caixa de seleção da
                tarefa em qualquer visão (Hoje, Amanhã, Inbox e Semana), a tarefa concluída é
                preservada com <code>completed_at</code> para o histórico auditável e uma nova
                instância idêntica é imediatamente gerada com a nova <code>due_date</code>, mantendo
                título, lista, tags e tempo estimado.
              </li>
              <li>
                <strong>Indicador visual discreto:</strong> ícone de setas circulares (
                <code>lucide Repeat</code>) em traço fino Champagne no cabeçalho do cartão e
                etiqueta textual amigável em pt-BR (ex.: <em>repete · seg, qua, sex</em>,{' '}
                <em>repete · a cada 2 dias</em>, <em>repete · mensal (dia 15)</em>).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Sub-tarefas com Checklist no Painel de Detalhe (Estilo TickTick / Todoist)</h3>
            <p>
              Checklist nativa embutida para subdivisão granular de tarefas sem complexidade de
              joins ou tabelas intermediárias:
            </p>
            <ul>
              <li>
                <strong>Adição e edição inline:</strong> no drawer lateral (TaskDetail), campo
                inline com tecla <code>Enter</code> para inclusão imediata e <code>Esc</code> para
                cancelar. Clique no título de qualquer sub-tarefa para edição inline com salvamento
                ao pressionar <code>Enter</code> ou desfocar (<code>blur</code>).
              </li>
              <li>
                <strong>Checkbox monocromático refinado:</strong> caixa de seleção de traço fino
                alinhada ao Design System Barbosa, com preenchimento em Champagne Ouro Fosco e texto
                esmaecido com tachado sutil ao concluir.
              </li>
              <li>
                <strong>Reordenação e exclusão:</strong> botões discretos de mover para cima/baixo
                ao passar o mouse (ou foco) para reordenar a sequência de execução, e botão de
                exclusão rápida.
              </li>
              <li>
                <strong>Contador e barra em Space Mono:</strong> cabeçalho da seção com progresso em
                formato <code>SUB-TAREFAS · 2/5</code> e micro barra proporcional de preenchimento.
                Quando todas as sub-tarefas estão completas, recebe sotaque discreto com ícone de
                conclusão <code>✓</code>.
              </li>
              <li>
                <strong>Indicador compacto nos cartões (TaskCard & Semana):</strong> cartões com
                sub-tarefas exibem chip Space Mono com contagem <code>2/5</code> e uma linha fina
                (2px) de progresso em Champagne sem alterar a altura estrutural do cartão.
              </li>
              <li>
                <strong>Regra de autonomia & Herança na Recorrência:</strong> concluir a tarefa
                principal NÃO altera as sub-tarefas e concluir todas as sub-tarefas NÃO fecha a
                tarefa principal (autonomia deliberada do usuário). Quando uma tarefa recorrente é
                concluída, a próxima instância gerada herda integralmente a lista de sub-tarefas com
                o status resetado (não concluídas).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Comparativo de Precisão Temporal</h3>
            <p>Controle estrito de acurácia entre planejamento e execução:</p>
            <ul>
              <li>
                Metadados visíveis em cada cartão de tarefa no formato padronizado{' '}
                <code>EST. X MIN · REAL Y</code>.
              </li>
              <li>
                Barra de preenchimento comparativa em proporção linear com destaque em Champagne
                Ouro Fosco quando o tempo real ultrapassa o previsto (<code>EXCEDIDO</code>).
              </li>
              <li>
                Painel lateral (drawer) de detalhes com reajuste granular de estimativas, data,
                lista e auditoria de sessões associadas.
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Pomodoro Avançado, Excesso & Transições Manuais (/pomodoro)</h3>
            <p>
              Sistema completo de temporização inspirado na arquitetura de blocos do TickTick e
              regras estritas de foco, integrado ao Design System Barbosa:
            </p>
            <ul>
              <li>
                <strong>
                  Página dedicada <code>/pomodoro</code>:
                </strong>{' '}
                layout em duas colunas com gerenciador de presets à esquerda (comutador
                Ativo/Arquivado, criação e edição com validação rigorosa de mínimo 5 min), visão
                geral analítica à direita (4 cartões de esforço acumulado e timeline cronológica de
                registros) e barra inferior fixa com display digital em Space Mono.
              </li>
              <li>
                <strong>
                  Presets customizáveis validados (<code>focus_presets</code>):
                </strong>{' '}
                regras que impedem salvar blocos de foco ou descansos menores que 5 minutos (foco ≥
                5 min, descanso curto ≥ 5 min, descanso longo ≥ 5 min e blocos para pausa longa ≥
                1), garantindo rigor metodológico e consistência no banco.
              </li>
              <li>
                <strong>Contagem de Excesso & Sem Transição Automática:</strong> ao zerar o tempo de
                foco previsto, o timer toca o som de dever cumprido e continua ativo em 00:00
                contando tempo excedente (<code>+00:01</code>, <code>+00:02</code>...) em Champagne
                Ouro Fosco. A pausa nunca se inicia sozinha: o usuário clica expressamente em{' '}
                <code>INICIAR PAUSA</code>, registrando a sessão com o tempo total (previsto +
                excesso) como <code>completa</code>.
              </li>
              <li>
                <strong>Pausa com Retomada Sob Demanda:</strong> quando a pausa zera, o som suave de
                volta ao trabalho é emitido, a pausa passa a contar excesso e nada inicia sozinho. O
                próximo bloco de foco só começa com a ação do usuário no botão{' '}
                <code>INICIAR PRÓXIMO BLOCO</code>.
              </li>
              <li>
                <strong>Três Sons Web Audio Nativos Destravados:</strong> inicialização suave do
                AudioContext no gesto do usuário (clique de Play / Iniciar) prevenindo suspensão
                silenciosa dos navegadores: acorde de início de foco (A4-C#5-E5), acorde de
                conclusão de foco (C5-E5-G5) e acorde de encerramento da pausa (G5-C5).
              </li>
              <li>
                <strong>Trava Multi-Abas com Sincronização (BroadcastChannel):</strong> impede a
                execução de dois cronômetros simultâneos em abas distintas. Ao ligar o timer em uma
                aba, as demais entram imediatamente em modo somente leitura com aviso discreto (
                <em>Timer ativo em outra aba</em>) e exibição do tempo espelhado em tempo real.
              </li>
              <li>
                <strong>Contador no Título da Aba & Favicon Dinâmico:</strong> o{' '}
                <code>document.title</code>
                reflete a cada segundo o tempo restante ou em excesso (ex.:{' '}
                <code>24:59 · Foco — Barbosa System</code>), e o favicon é renderizado via Canvas
                com anel de progresso circular dinâmico em Champagne, sendo restaurado para o ícone
                padrão ao finalizar.
              </li>
              <li>
                <strong>Notificações Nativas em Segundo Plano:</strong> se a aba estiver oculta (
                <code>document.hidden</code>) ao zerar o foco ou o descanso, uma notificação de
                backup do navegador é disparada alertando o usuário para iniciar a pausa ou o
                próximo bloco, reutilizando a permissão de notificações do sistema.
              </li>
              <li>
                <strong>Contabilidade e Notas de Sessão (com ou sem tarefa vinculada):</strong>{' '}
                apenas blocos de foco gravam sessões na coleção <code>sessions</code> e, havendo
                tarefa vinculada, somam minutos ao seu <code>actual_minutes</code>. O prompt de nota
                &quot;O que foi feito?&quot; funciona de forma 100% não-bloqueante durante a pausa
                ou na barra inferior, sendo gravado de modo resiliente tanto para sessões atreladas
                a tarefas quanto para sessões de foco livre (sem tarefa vinculada, onde o campo
                relacional <code>task</code> permanece nulo/opcional no banco).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Métricas e Análise Histórica com Meta Diária & Marcações de Recorde</h3>
            <p>
              Auditoria quantitativa do foco acumulado, acompanhamento de metas e recordes pessoais:
            </p>
            <ul>
              <li>
                <strong>Meta diária reativa por dia da semana:</strong> cartão destacado no topo do
                Histórico exibindo a meta específica configurada para o dia corrente (Seg–Dom), com
                o tempo real acumulado pelas sessões de hoje.
              </li>
              <li>
                <strong>Barra de progresso inteligente:</strong> preenchimento proporcional neutro
                abaixo da meta e transição automática para Champagne Ouro Fosco (
                <code>#C5A880</code>) com emblema <code>META ALCANÇADA</code> ao cumprir o objetivo
                planejado. Em dias com meta zerada (folga), apresenta badge discreto{' '}
                <code>SEM META (FOLGA)</code> tratando adequadamente divisão por zero.
              </li>
              <li>
                <strong>Benchmark do mesmo dia da semana:</strong> linha contextual refinada em
                Space Mono no rodapé do cartão de meta de hoje comparando a produção atual com a
                média e o recorde histórico daquele mesmo dia (ex.:{' '}
                <em>SUAS SEGUNDAS: MÉDIA 1H 40M · RECORDE 2H 30M</em>).
              </li>
              <li>
                <strong>Cartão "MELHOR DIA" no painel de métricas:</strong> quarto cartão integrado
                ao grid (Hoje, Esta Semana, Total e Melhor Dia). Identifica de forma 100% dinâmica o
                dia com maior volume de minutos de foco da história da conta e exibe sua data
                formatada em pt-BR junto ao selo <code>HOJE É O RECORDE</code> (quando o usuário
                supera a melhor marca) ou a contagem regressiva precisa <code>FALTAM X MIN</code>{' '}
                para igualar ou bater o recorde.
              </li>
              <li>
                <strong>Histograma de 14 dias com destaque de pico:</strong> gráfico de barras
                proporcional onde a barra correspondente ao melhor dia do período ganha contorno e
                acabamento Champagne Ouro Fosco (<code>#C5A880</code>) com badge superior{' '}
                <code>RECORDE</code>
                em traço fino, permitindo visualização imediata da melhor performance dos últimos 14
                dias.
              </li>
              <li>
                <strong>Marcador discreto nos cabeçalhos da lista diária:</strong> no agrupamento
                cronológico, se um dia for o recordista absoluto do histórico, o cabeçalho exibe uma
                pílula sóbria em Champagne com ícone fino de troféu e rótulo <code>RECORDE</code>.
              </li>
              <li>
                <strong>Sutileza na visão /pomodoro:</strong> no painel de visão geral da página
                Pomodoro, o cartão "Foco de hoje" ganha chip discreto <code>RECORDE</code> e dica
                inferior em Space Mono mostrando quanto falta para bater a marca histórica,
                preservando a sobriedade visual.
              </li>
              <li>
                <strong>Regra de cálculo transparente e zero mock:</strong> todas as métricas são
                computadas estritamente a partir do histórico real de sessões do usuário recuperadas
                da coleção <code>sessions</code>, agrupadas por <code>session_date</code> e somadas
                em minutos reais (com consistência absoluta entre Pomodoro e Histórico).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Central de Configurações (Estilo Todoist) & Gestão de Etiquetas</h3>
            <p>Painel com navegação lateral em duas colunas para objetivos, acervo e conta:</p>
            <ul>
              <li>
                <strong>Metas específicas por dia da semana:</strong> controle individual para os 7
                dias (Seg, Ter, Qua, Qui, Sex, Sáb, Dom) em <code>/configuracoes</code>, permitindo
                calibrar rotinas pesadas em dias úteis e períodos leves ou de descanso aos finais de
                semana.
              </li>
              <li>
                <strong>Controle por stepper e digitação direta:</strong> incremento/decremento de
                15 min (0 a 720 min por dia), digitação direta do valor numérico, feedback sutil de
                salvamento <code>SALVO</code> e persistência no campo JSON{' '}
                <code>weekly_focus_goals</code> da coleção <code>users</code>.
              </li>
              <li>
                <strong>Gerenciamento Completo de Etiquetas & Listas (/configuracoes):</strong> abas
                dedicadas para administração integral das etiquetas (<code>tags</code>) e
                listas/projetos (<code>lists</code>). Permite criar com seletor visual da paleta{' '}
                <em>quiet luxury</em>, renomear inline com tecla Enter/Esc, alternar prioridade
                80/20 (marcador de pin), inspecionar o código HEX e acompanhar o contador em tempo
                real de tarefas vinculadas. Na exclusão, executa desassociação segura em cascata.
              </li>
              <li>
                <strong>Priorização 80/20 na Sidebar:</strong> seções colapsáveis ETIQUETAS e LISTAS
                na barra lateral com contagem de tarefas abertas em Space Mono. As etiquetas e
                listas marcadas como prioritárias (ex.: Big3) ficam fixadas no topo com indicador
                champagne sutil. A ordem é personalizada via arrastar-e-soltar (desktop e mobile) e
                sincronizada via Server-Sent Events.
              </li>
              <li>
                <strong>Efeito Big3 nas Visões & Cartão de Topo (v0.0.24):</strong> tarefas
                pertencentes a etiquetas ou listas prioritárias (<code>pinned=true</code>) exibem o
                indicador discreto
                <code>BIG3</code> em Space Mono acompanhado do ponto na cor da etiqueta/lista
                prioritária em todas as visões (Hoje, Amanhã, Inbox e Semana). No topo da visão
                Hoje, o cartão
                <strong>BIG3</strong> seleciona as até 3 tarefas do dia que valem os 80% do
                resultado, ordenadas pela prioridade da etiqueta/lista (order + pinned) e
                desempatadas por P1–P4, horário e ordem manual. Permite conclusão rápida com
                checkbox integrado e aciona o selo discreto champagne <code>BIG3 COMPLETO</code> ao
                finalizar as 3 tarefas.
              </li>
              <li>
                <strong>Perfil Clicável na Sidebar & Acesso Integrado (v0.0.25):</strong> o bloco de
                perfil no rodapé da barra lateral (avatar com iniciais + nome do usuário) é uma área
                clicável direta para <code>/configuracoes</code> com hover sutil em fundo elevado e
                affordance discreta. O botão de encerramento de sessão (logout) atua de forma
                independente e segura, acionando uma caixa de confirmação rápida antes de sair. As
                antigas opções soltas de Configurações e Documentação foram removidas do rodapé da
                sidebar, e no mobile o toque no avatar conduz imediatamente às Configurações.
              </li>
              <li>
                <strong>Documentação Integrada às Configurações (v0.0.25):</strong> a navegação
                lateral de <code>/configuracoes</code> inclui a seção
                <strong>Documentação</strong> com ícone de livro fino e seta indicativa que conduz a{' '}
                <code>/docs</code>, preservando a rota direta e bookmarkável com fluxo centralizado.
              </li>
              <li>
                <strong>Navegação Mobile Otimizada (v0.0.28):</strong> arquitetura móvel reformulada
                para recuperar mais de 100px de altura útil de conteúdo e eliminar scroll
                horizontal:
                <ul style={{ marginTop: '6px' }}>
                  <li>
                    <strong>Barra inferior de navegação (Bottom Nav):</strong> barra fixa com 5
                    destinos essenciais (Hoje, Amanhã, Semana, Pomodoro e Histórico), ícone +
                    rótulo, destaque champagne e alvos de toque ergonômicos (≥44px) com respeito ao
                    safe-area-inset.
                  </li>
                  <li>
                    <strong>Drawer lateral via hambúrguer:</strong> no cabeçalho superior móvel, o
                    botão de menu abre gaveta lateral (deslizando da esquerda) contendo a árvore
                    completa da sidebar: navegação completa, seções ETIQUETAS e LISTAS com contagens
                    e pin 80/20, e Inbox.
                  </li>
                  <li>
                    <strong>Captura flutuante rápida (FAB):</strong> a antiga barra fixa no rodapé
                    vira um botão flutuante (+) acima da bottom nav que expande suavemente para a
                    barra completa de captura sob demanda, mantendo o timer do Pomodoro integrado
                    acima da barra inferior.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Integridade Visual & Layout Responsivo - Etapa 1 (v0.0.29):</strong> revisão
                completa da integridade visual e consistência em todas as resoluções (de smartphones
                a monitores ultrawide / 27"):
                <ul style={{ marginTop: '6px' }}>
                  <li>
                    <strong>Proteção de Chips de Metadados:</strong> aplicação de{' '}
                    <code>min-width: 0</code>, truncamento com <code>ellipsis</code> e limite de
                    chips visíveis com indicador <code>+N</code> (padrão TickTick), impedindo
                    quebras verticais ou sobreposição entre vizinhos.
                  </li>
                  <li>
                    <strong>Área Real & Overflow na Semana:</strong> o grid de 7 colunas agora
                    utiliza cálculo e rolagem horizontal suave contida em laptops de 1300–1600px
                    (considerando os 260px da sidebar), eliminando o overflow de janela sem cortar
                    colunas.
                  </li>
                  <li>
                    <strong>Escala Coerente de Largura Máxima:</strong> layout do conteúdo central
                    adaptável (816px até 1280px, 960px até 1600px e 1080px em telas ≥1600px / 27"),
                    oferecendo harmonia sem dispersão visual.
                  </li>
                  <li>
                    <strong>Painel de Detalhe Flexível:</strong> gaveta lateral com{' '}
                    <code>width: min(420px, 100vw)</code> e safe-areas, adaptando-se sem estouro em
                    qualquer largura de smartphone.
                  </li>
                  <li>
                    <strong>Auditoria e Escala de Z-Index:</strong> camadas estruturadas (headers
                    15, sidebar 20, mobile header 30, bottom nav 40, widget Pomodoro/FAB 45, drawer
                    50) e respiro inferior generoso para que nenhum controle fique encoberto.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Atalhos em lote:</strong> botões de sincronização rápida para copiar a meta
                de Segunda para todos os dias úteis ou sincronizar Sábado e Domingo.
              </li>
              <li>
                <strong>Painel de Conta:</strong> exibição segura de dados cadastrais (nome, e-mail,
                ID do sistema, provedor e data de criação).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Autenticação e Sincronização em Tempo Real</h3>
            <p>Infraestrutura de segurança e consistência de dados:</p>
            <ul>
              <li>
                Fluxos completos de e-mail e senha: login, criação de conta com nome/avatar,
                verificação de e-mail e recuperação de senha.
              </li>
              <li>
                Assinatura SSE (Server-Sent Events) via PocketBase Realtime para sincronização
                instantânea entre múltiplas abas e dispositivos, sem recarregar a tela.
              </li>
            </ul>
          </article>
        </div>
      </section>

      {/* SEÇÃO 2: FERRAMENTAS / STACK */}
      <section className="docs-section" id="ferramentas">
        <div className="docs-section-header">
          <span className="docs-section-num">02</span>
          <div>
            <h2>Ferramentas & Arquitetura Tecnológica</h2>
            <p>Tecnologias de front-end, runtime, backend e bibliotecas essenciais</p>
          </div>
        </div>

        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Camada</th>
                <th>Tecnologia / Biblioteca</th>
                <th>Versão</th>
                <th>Finalidade no Projeto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Core Frontend</td>
                <td>
                  <code>React</code>
                </td>
                <td>
                  <code>^19.2.7</code>
                </td>
                <td>Biblioteca base de componentes reativos e interfaces de usuário modernas</td>
              </tr>
              <tr>
                <td>Compilação / Dev</td>
                <td>
                  <code>Vite</code> + <code>TypeScript</code>
                </td>
                <td>
                  <code>8.0 / 6.0</code>
                </td>
                <td>Bundler ultra-rápido ESM com tipagem estática rigorosa ponta a ponta</td>
              </tr>
              <tr>
                <td>Roteamento</td>
                <td>
                  <code>react-router-dom</code>
                </td>
                <td>
                  <code>^7.18.2</code>
                </td>
                <td>
                  Navegação declarativa SPA, proteção de rotas privadas e parâmetros de visualização
                </td>
              </tr>
              <tr>
                <td>Estilização & UI</td>
                <td>
                  <code>Tailwind CSS</code> + <code>shadcn/ui</code>
                </td>
                <td>
                  <code>^3.4.19</code>
                </td>
                <td>
                  Framework utilitário para design system dark com primitivas Radix UI customizadas
                </td>
              </tr>
              <tr>
                <td>Ícones</td>
                <td>
                  <code>lucide-react</code>
                </td>
                <td>
                  <code>^0.577.0</code>
                </td>
                <td>Ícones SVG vetoriais em traço fino monocromático (stroke-width 1.5)</td>
              </tr>
              <tr>
                <td>Backend / Cloud</td>
                <td>
                  <code>PocketBase (Skip Cloud)</code>
                </td>
                <td>
                  <code>~0.26.9</code>
                </td>
                <td>
                  Backend headless embarcado: banco de dados SQLite, auth segura, migrations e SSE
                </td>
              </tr>
              <tr>
                <td>Comunicação Realtime</td>
                <td>
                  <code>Server-Sent Events (SSE)</code>
                </td>
                <td>Nativo PB</td>
                <td>
                  Inscrição reativa nas coleções <code>tasks</code> e <code>sessions</code> para
                  auto-refresh
                </td>
              </tr>
              <tr>
                <td>Parser PNL de Datas & Recorrência</td>
                <td>
                  <code>src/lib/date-parser.ts</code>
                </td>
                <td>Interno (v0.0.25)</td>
                <td>
                  Mecanismo autônomo de linguagem natural em pt-BR: datas futuras (dd/mm, dia N de
                  mês, em N dias, próxima segunda), recorrência (todo dia, toda semana, todo dia 15,
                  toda segunda), horário (14:00, às 9h30) e autocomplete de prioridades (P1–P4)
                </td>
              </tr>
              <tr>
                <td>Mecanismo Big3 (80/20)</td>
                <td>
                  <code>src/services/data.ts</code>
                </td>
                <td>v0.0.25</td>
                <td>
                  Derivação e ranqueamento inteligente das até 3 tarefas do dia que geram os 80% de
                  resultado a partir de etiquetas e listas prioritárias fixadas (pinned),
                  respeitando desempates por nível de prioridade (P1–P4), horário agendado e ordem
                  sequencial.
                </td>
              </tr>
              <tr>
                <td>Navegação Mobile (Bottom Nav + Sheet Drawer)</td>
                <td>
                  <code>src/components/Layout.tsx</code>
                </td>
                <td>v0.0.28</td>
                <td>
                  Barra inferior fixa de 5 destinos ao alcance do polegar, drawer lateral completo
                  via hambúrguer no topo com suporte a etiquetas/listas/pin 80/20, e botão flutuante
                  (FAB) de captura rápida responsiva com respeito a safe-area.
                </td>
              </tr>
              <tr>
                <td>Layout Responsivo & Integridade Visual (Etapa 1)</td>
                <td>
                  <code>src/main.css</code>, <code>src/components/TaskCard.tsx</code>
                </td>
                <td>v0.0.29</td>
                <td>
                  Chips com truncamento e limite +N, área real de conteúdo da Semana, escala de
                  largura máxima para 27" (1080px), gaveta de detalhe fluida e auditoria rigorosa de
                  camadas de z-index.
                </td>
              </tr>
              <tr>
                <td>Estado Global</td>
                <td>
                  <code>AuthContext</code> & <code>PomodoroContext</code>
                </td>
                <td>React Context</td>
                <td>Gerenciamento de sessão de usuário e persistência global do timer de foco</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SEÇÃO 3: DESIGN SYSTEM */}
      <section className="docs-section" id="design-system">
        <div className="docs-section-header">
          <span className="docs-section-num">03</span>
          <div>
            <h2>Design System Barbosa System</h2>
            <p>Filosofia estética quiet luxury, tokens imutáveis e regras de aplicação</p>
          </div>
        </div>

        <div className="docs-card" style={{ marginBottom: '20px' }}>
          <h3>Princípios & Filosofia Visual</h3>
          <p>
            O design system é pautado pelo <strong>Dark-First</strong> absoluto e pela sofisticação
            discreta (<em>quiet luxury</em>). Não utiliza gradientes berrantes, néon roxo/ciano,
            brilhos ou cards chamativos. O acento metálico quente é reservado para microinterações e
            pontos de foco primário, garantindo concentração total e fadiga visual mínima.
          </p>
        </div>

        <h3 className="docs-subsection-title">Paleta de Cores e Tokens Fundamentais</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Nome do Token</th>
                <th>Valor / Código</th>
                <th>Amostra</th>
                <th>Regra de Aplicação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Carbono Obsidiana</td>
                <td>
                  <code>#090A0E</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#090a0e' }} />
                </td>
                <td>Fundo mestre da aplicação, shell, cabeçalhos fixos e inputs primários</td>
              </tr>
              <tr>
                <td>Grafite Titânio</td>
                <td>
                  <code>#12141C</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#12141c' }} />
                </td>
                <td>Superfície de cartões, barra de captura, drawers laterais e timer widget</td>
              </tr>
              <tr>
                <td>Champagne Ouro Fosco</td>
                <td>
                  <code>#C5A880</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#c5a880' }} />
                </td>
                <td>
                  Sotaque único metálico quente. CTAs primários, marcações ativas, progresso do
                  Pomodoro (máx. 10% da tela)
                </td>
              </tr>
              <tr>
                <td>Platina Puro</td>
                <td>
                  <code>#F4F4F6</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#f4f4f6' }} />
                </td>
                <td>Texto primário, títulos em Clash Display, números de alta ênfase</td>
              </tr>
              <tr>
                <td>Titânio Neutro</td>
                <td>
                  <code>#A1A1AA</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#a1a1aa' }} />
                </td>
                <td>Texto secundário, rótulos auxiliares, ícones desativados, subtítulos</td>
              </tr>
              <tr>
                <td>Cinza Acessível Secundário (WCAG AA)</td>
                <td>
                  <code>#94949E</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#94949e' }} />
                </td>
                <td>
                  Rótulos de dados, cabeçalhos de Space Mono, hints de Pomodoro e texto secundário
                  com contraste auditado ≥4.5:1
                </td>
              </tr>
              <tr>
                <td>Cinza Acessível Terciário (WCAG AA)</td>
                <td>
                  <code>#80808A</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#80808a' }} />
                </td>
                <td>
                  Placeholders, metadados de suporte e legendas atenuadas com legibilidade garantida
                  em fundo dark
                </td>
              </tr>
              <tr>
                <td>Borda Estrutural P4 / Painéis</td>
                <td>
                  <code>#5F606A</code>
                </td>
                <td>
                  <span className="color-swatch" style={{ background: '#5f606a' }} />
                </td>
                <td>
                  Contorno com contraste WCAG AA para prioridade P4 (baixa), bordas táteis de
                  formulários e divisões secundárias
                </td>
              </tr>
              <tr>
                <td>Borda Ouro Champagne</td>
                <td>
                  <code>rgba(197, 168, 128, 0.12)</code>
                </td>
                <td>
                  <span
                    className="color-swatch"
                    style={{ background: '#12141c', border: '1px solid #c5a880' }}
                  />
                </td>
                <td>Contorno refinado de cartões, caixas de diálogo, inputs e painéis</td>
              </tr>
              <tr>
                <td>Divisores Estruturais</td>
                <td>
                  <code>rgba(255, 255, 255, 0.08)</code>
                </td>
                <td>
                  <span
                    className="color-swatch"
                    style={{
                      background: '#090a0e',
                      borderBottom: '2px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </td>
                <td>Separação de sessões, divisões na sidebar, bordas de tabelas e grids</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-subsection-title" style={{ marginTop: '32px' }}>
          Tipografia & Hierarquia Textual
        </h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Família</th>
                <th>Pesos Suportados</th>
                <th>Letter-spacing / Leading</th>
                <th>Uso Exclusivo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>Clash Display</code>
                </td>
                <td>500 (Medium), 600 (Semibold)</td>
                <td>
                  <code>-0.02em</code>
                </td>
                <td>Títulos principais (h1, h2), cabeçalhos de visualização e painel lateral</td>
              </tr>
              <tr>
                <td>
                  <code>Plus Jakarta Sans</code>
                </td>
                <td>400 (Regular), 500 (Medium)</td>
                <td>
                  <code>line-height: 1.6</code>
                </td>
                <td>Corpo de texto geral, formulários, botões da interface, títulos de tarefas</td>
              </tr>
              <tr>
                <td>
                  <code>Space Mono</code>
                </td>
                <td>400 (Regular), 700 (Bold)</td>
                <td>
                  <code>0.08em</code> (uppercase, 10–13px)
                </td>
                <td>Tempos, métricas, tags, badges, contadores, valores hex e código tabular</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="docs-grid" style={{ marginTop: '24px' }}>
          <article className="docs-card">
            <h3>Identidade de Marca & Logotipo</h3>
            <div className="docs-brand-demo">
              <BrandMark className="docs-brand-logo" />
              <div>
                <strong>BARBOSA SYSTEM</strong>
                <span>MONOGRAMA BS EM CHAMPAGNE · WORDMARK ESPAÇADO</span>
              </div>
            </div>
            <p>
              Lockup dark padronizado contendo o monograma geométrico <strong>BS</strong> com
              acabamento ouro fosco, acompanhado pelo wordmark com tracking ampliado em Space Mono.
              Dimensão mínima de 36px no desktop e 24px em dispositivos móveis.
            </p>
          </article>

          <article className="docs-card">
            <h3>Iconografia & Diretrizes Restritas</h3>
            <p>Regras compulsórias de consistência visual:</p>
            <ul>
              <li>
                <strong>Apenas traço fino:</strong> biblioteca <code>lucide-react</code> renderizada
                em traço fino com <code>stroke-width: 1.5</code>.
              </li>
              <li>
                <strong>Monocromático:</strong> ícones respeitam as cores Titânio (
                <code>#A1A1AA</code>) em repouso e Platina (<code>#F4F4F6</code>) ou Champagne (
                <code>#C5A880</code>) quando ativos.
              </li>
              <li>
                <strong>Proibições explícitas:</strong> terminantemente proibido o uso de emojis
                coloridos, ícones de IA genéricos (como estrelas brilhantes mágicas), sombras
                coloridas ou degradês de saturação alta.
              </li>
            </ul>
          </article>
        </div>

        {/* DIRETRIZES DE ACESSIBILIDADE WCAG AA & RESPONSIVIDADE (ETAPAS 1 E 2) */}
        <h3 className="docs-subsection-title" style={{ marginTop: '36px' }}>
          Acessibilidade (WCAG 2.1 AA) & Engenharia Responsiva
        </h3>
        <div className="docs-card" style={{ marginBottom: '20px' }}>
          <p>
            O Barbosa System implementa uma arquitetura rigorosa de acessibilidade digital aliada à
            filosofia estética <em>quiet luxury</em>. Todas as interfaces respeitam contraste mínimo
            de 4.5:1, áreas de toque generosas conforme diretrizes de ergonomia móvel, respeito
            irrestrito às preferências de movimento do usuário e adaptação proporcional de layouts
            em tablets, desktops e telas ultrawide.
          </p>
        </div>

        <div className="docs-grid">
          <article className="docs-card">
            <h3>Piso Tipográfico & Contraste WCAG AA</h3>
            <ul>
              <li>
                <strong>Piso tipográfico de 11px:</strong> erradicação total de fontes
                sub-dimensionadas (9px e 10px). Todas as métricas em Space Mono, datas, tags,
                badges, contadores e rótulos estruturais operam com no mínimo 11px, garantindo
                legibilidade perfeita em qualquer display.
              </li>
              <li>
                <strong>Tokens de Contraste Recalibrados:</strong> substituição dos cinzas de baixo
                contraste (<code>#71717A</code> / <code>#52525B</code>) pelos tokens oficiais WCAG
                AA: <code>#94949E</code> (secundário, contraste ≥4.5:1 em <code>#090A0E</code> e{' '}
                <code>#12141C</code>), <code>#80808A</code> (terciário legível) e{' '}
                <code>#5F606A</code> (bordas estruturais e prioridade P4).
              </li>
              <li>
                <strong>Aplicação Abrangente:</strong> contraste validado em histórico, gráficos de
                14 dias, formulários de criação, cabeçalhos de seção da sidebar, chips de filtro,
                hints de pausa do Pomodoro e colunas de planejamento semanal.
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Hit-boxes de Toque Ergonômicas (≥40px / 44px)</h3>
            <ul>
              <li>
                <strong>Checkboxes principais:</strong> pseudo-elemento invisível{' '}
                <code>::before</code> de <code>44x44px</code> em <code>.check</code> (cartões das
                visões Hoje/Amanhã/Inbox) e <code>.big3-check-btn</code>, garantindo ativação por
                toque sem esforço motor.
              </li>
              <li>
                <strong>Checkboxes secundários:</strong> área mínima expandida de{' '}
                <code>40x40px</code> em <code>.week-task-card .check</code> e{' '}
                <code>.subtask-checkbox</code> no drawer de detalhes.
              </li>
              <li>
                <strong>Botões interativos e cabeçalhos colapsáveis:</strong> altura mínima e
                hit-box de pelo menos <code>40px</code> nos botões FOCUS (<code>.focus</code>,{' '}
                <code>.week-task-card .focus</code>), chips de filtro por etiqueta (
                <code>.tag-filter-chip</code>), cabeçalhos colapsáveis da sidebar (
                <code>.sidebar-section-header</code>), grupos colapsáveis de tarefas (
                <code>.task-group-header</code>) e sumários de tarefas concluídas (
                <code>.completed summary</code>, <code>.column-completed summary</code>).
              </li>
              <li>
                <strong>Preservação de Arrastar-e-Soltar:</strong> hit-boxes otimizadas sem
                interferência no <code>task-drag-handle</code>, mantendo a reordenação manual por
                toque e mouse fluida e estável.
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Suporte a prefers-reduced-motion</h3>
            <p>
              Media query global <code>@media (prefers-reduced-motion: reduce)</code> implementada
              na folha de estilos mestre (<code>src/main.css</code>):
            </p>
            <ul>
              <li>
                <strong>Eliminação de Animações Decorativas:</strong> keyframes decorativos de
                entrada de cards, drawers laterais e banners são desativados (
                <code>animation: none</code> e <code>animation-duration: 0.01ms</code>).
              </li>
              <li>
                <strong>Transições Imediatas:</strong> transições CSS reduzidas para{' '}
                <code>0.01ms</code> e rolagem suave revertida para salto imediato (
                <code>scroll-behavior: auto</code>), prevenindo náusea e desconforto vestibular.
              </li>
              <li>
                <strong>Integridade do Temporizador Pomodoro:</strong> a lógica de contagem do
                temporizador Pomodoro é executada puramente em tempo de execução JavaScript
                (intervalos de segundo), sem qualquer dependência de animações CSS, preservando a
                precisão absoluta do foco.
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Breakpoints Responsivos & Cabeçalho Tablet (769–1024px)</h3>
            <p>
              Arquitetura de visualização calibrada por largura de viewport e área real de conteúdo:
            </p>
            <ul>
              <li>
                <strong>Cabeçalho da Semana no Tablet (769–1024px):</strong> bloco de título
                empilhado de forma limpa com as 3 métricas de topo (Carga da Semana, Estimativa
                Total e Inbox não agendada) reorganizadas em um grid de 3 colunas dedicadas abaixo
                do título, impedindo aperto visual e quebra desordenada de texto.
              </li>
              <li>
                <strong>Mobile (&lt;768px):</strong> cabeçalho empilhado verticalmente com métricas
                em 2 colunas e inbox ocupando largura total, otimizado para interação com uma mão.
              </li>
              <li>
                <strong>Desktop (≥1025px):</strong> layout em linha ampla com métricas alinhadas à
                direita e grade de 7 colunas com cálculo contido na área útil descontando a sidebar
                fixa.
              </li>
            </ul>
          </article>
        </div>

        <h4 className="docs-subsection-title" style={{ marginTop: '24px' }}>
          Tabela de Breakpoints e Escala de Área Útil (Etapa 1 & 2)
        </h4>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Dispositivo / Resolução</th>
                <th>Intervalo Viewport</th>
                <th>Largura Máx. do Conteúdo</th>
                <th>Comportamento da Visão Semana</th>
                <th>Navegação & Painéis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mobile (Smartphones)</td>
                <td>
                  <code>&le; 768px</code>
                </td>
                <td>
                  <code>100%</code> (padding 14–16px)
                </td>
                <td>7 colunas empilhadas verticalmente; métricas em grade 2 colunas</td>
                <td>Bottom nav fixa (5 itens), FAB de captura flutuante e gaveta via hambúrguer</td>
              </tr>
              <tr>
                <td>Tablet / iPad Portrait</td>
                <td>
                  <code>769px – 1024px</code>
                </td>
                <td>
                  <code>100%</code> (fluido)
                </td>
                <td>
                  Cabeçalho com métricas em grid de 3 colunas abaixo do título; colunas adaptadas
                </td>
                <td>Sidebar colapsável, drawer lateral fluido (máx. 420px)</td>
              </tr>
              <tr>
                <td>Laptop Compacto / Médio</td>
                <td>
                  <code>1025px – 1280px</code>
                </td>
                <td>
                  <code>816px</code> (centrado)
                </td>
                <td>
                  7 colunas completas com scroll horizontal contido na área real (-260px sidebar)
                </td>
                <td>Sidebar fixa 260px, drawer TaskDetail deslizante à direita</td>
              </tr>
              <tr>
                <td>Desktop Padrão (Full HD)</td>
                <td>
                  <code>1281px – 1600px</code>
                </td>
                <td>
                  <code>960px</code> (centrado)
                </td>
                <td>Grade ampla de 7 colunas perfeitamente visíveis sem overflow de janela</td>
                <td>Sidebar fixa com área de expansão e foco livre</td>
              </tr>
              <tr>
                <td>Monitores Grandes / 27&quot; / 4K</td>
                <td>
                  <code>&ge; 1601px</code>
                </td>
                <td>
                  <code>1080px</code> (centrado)
                </td>
                <td>
                  Exibição monumental com respiros generosos e proporção áurea <em>quiet luxury</em>
                </td>
                <td>Layout centralizado com limites estritos anti-dispersão visual</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SEÇÃO 4: BANCO DE DADOS */}
      <section className="docs-section" id="banco-de-dados">
        <div className="docs-section-header">
          <span className="docs-section-num">04</span>
          <div>
            <h2>Banco de Dados & Schema PocketBase</h2>
            <p>Estrutura relacional, tipos de dados, índices e regras de acesso (RLS)</p>
          </div>
        </div>

        <div className="docs-card" style={{ marginBottom: '24px' }}>
          <h3>Isolamento de Dados por Usuário (Zero Mocks)</h3>
          <p>
            O Barbosa System opera exclusivamente com{' '}
            <strong>dados 100% reais persistidos no SQLite/PocketBase</strong>. Todas as coleções de
            domínio (<code>lists</code>, <code>tasks</code>, <code>sessions</code>) implementam
            Row-Level Security (RLS) estrita no motor do PocketBase: nenhum usuário tem visibilidade
            ou permissão de gravação sobre dados de terceiros.
          </p>
        </div>

        {/* COLEÇÃO: users */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">SISTEMA AUTH</span>
              <h3>users</h3>
            </div>
            <div className="docs-rule-badge">
              <code>list, view, update, delete: id = @request.auth.id</code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Coleção nativa de autenticação que armazena as contas registradas, credenciais seguras e
            perfil.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>Identificador alfanumérico único gerado pelo PocketBase (15 chars)</td>
                </tr>
                <tr>
                  <td>
                    <code>email</code>
                  </td>
                  <td>
                    <code>email</code>
                  </td>
                  <td>Sim</td>
                  <td>Endereço eletrônico único indexado para autenticação e recuperação</td>
                </tr>
                <tr>
                  <td>
                    <code>name</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Não</td>
                  <td>Nome de exibição do usuário utilizado no cabeçalho e avatar da sidebar</td>
                </tr>
                <tr>
                  <td>
                    <code>avatar</code>
                  </td>
                  <td>
                    <code>file</code>
                  </td>
                  <td>Não</td>
                  <td>Arquivo de foto de perfil (PNG/JPG)</td>
                </tr>
                <tr>
                  <td>
                    <code>daily_focus_goal_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Meta diária legado/fallback de foco pessoal em minutos (default 120, mín. 15,
                    máx. 720).
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>weekly_focus_goals</code>
                  </td>
                  <td>
                    <code>json</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Metas de foco individualizadas por dia da semana em minutos (objeto com chaves{' '}
                    <code>dom, seg, ter, qua, qui, sex, sab</code>, inteiros de 0 a 720 min).
                    Gerenciadas na nova tela <code>/configuracoes</code>.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>notification_preferences</code>
                  </td>
                  <td>
                    <code>json</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Preferências de alerta do usuário (objeto com <code>enabled</code>,{' '}
                    <code>lead_minutes</code> e <code>sound_enabled</code>). Gerenciadas em{' '}
                    <code>/configuracoes</code> (seção Produtividade & Alertas).
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps de criação e última modificação da conta</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* COLEÇÃO: tags */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">BASE COLLECTION</span>
              <h3>tags</h3>
            </div>
            <div className="docs-rule-badge">
              <code>@request.auth.id != '' && user.id = @request.auth.id</code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Etiquetas transversais de categorização criadas e associadas às tarefas via{' '}
            <code>@etiqueta</code> na captura rápida ou no painel lateral de detalhes.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>
                    Identificador primário único alfanumérico da etiqueta gerado pelo PocketBase
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>name</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Nome identificador da etiqueta (máx. 30 caracteres, ex.: <code>trabalho</code>,{' '}
                    <code>urgente</code>, <code>saude</code>)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>user</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    FK referenciando <code>users.id</code> (cascadeDelete: true, maxSelect: 1)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>color</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Código hex da cor discreta <em>quiet luxury</em> da paleta Barbosa System (ex.:{' '}
                    <code>#C5A880</code>, <code>#8F9E82</code>, <code>#7E92A2</code>)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>order</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Índice de priorização sequencial na sidebar e listas via arrastar-e-soltar.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>pinned</code>
                  </td>
                  <td>
                    <code>bool</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Marcação de prioridade 80/20 (true = fixada no topo da sidebar com destaque
                    champagne).
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps de criação e última modificação da etiqueta</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="docs-indices">
            <span>ÍNDICES:</span> <code>idx_tags_user_name (UNIQUE: user, name)</code> ·{' '}
            <code>idx_tags_user (user)</code> ·{' '}
            <code>idx_tags_user_pinned_order (user, pinned, order)</code>
          </div>
        </div>

        {/* COLEÇÃO: lists */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">BASE COLLECTION</span>
              <h3>lists</h3>
            </div>
            <div className="docs-rule-badge">
              <code>@request.auth.id != '' && user.id = @request.auth.id</code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Categorias ou projetos associados às tarefas via tags <code>#nome</code> na barra de
            captura.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>Identificador alfanumérico primário da lista</td>
                </tr>
                <tr>
                  <td>
                    <code>name</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Nome legível da lista (máx. 40 caracteres, ex.: <code>Trabalho</code>,{' '}
                    <code>Pessoal</code>)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>user</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    FK referenciando <code>users.id</code> (cascadeDelete: true, maxSelect: 1)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>order</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Índice numérico de ordenação sequencial na barra lateral (arrastar e soltar).
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>pinned</code>
                  </td>
                  <td>
                    <code>bool</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Selo de prioridade 80/20 (true = fixada no topo da seção LISTAS na sidebar).
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps de auditoria de inserção e atualização</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="docs-indices">
            <span>ÍNDICES:</span> <code>idx_lists_user_name (UNIQUE: user, name)</code> ·{' '}
            <code>idx_lists_user (user)</code> ·{' '}
            <code>idx_lists_user_pinned_order (user, pinned, order)</code>
          </div>
        </div>

        {/* COLEÇÃO: tasks */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">BASE COLLECTION</span>
              <h3>tasks</h3>
            </div>
            <div className="docs-rule-badge">
              <code>@request.auth.id != '' && user.id = @request.auth.id</code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Unidade nuclear de trabalho do sistema, contendo prazos, progresso e estimativas.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>Identificador único alfanumérico da tarefa</td>
                </tr>
                <tr>
                  <td>
                    <code>title</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>Título da tarefa (máx. 200 caracteres)</td>
                </tr>
                <tr>
                  <td>
                    <code>user</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Sim</td>
                  <td>FK vinculada ao usuário criador (cascadeDelete: true, maxSelect: 1)</td>
                </tr>
                <tr>
                  <td>
                    <code>list</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Não</td>
                  <td>
                    FK opcional para a coleção <code>lists</code> (cascadeDelete: false)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>due_date</code>
                  </td>
                  <td>
                    <code>date</code>
                  </td>
                  <td>Não</td>
                  <td>Data de agendamento (ISO 8601 a meio-dia UTC). Se vazio, reside no Inbox</td>
                </tr>
                <tr>
                  <td>
                    <code>done</code>
                  </td>
                  <td>
                    <code>bool</code>
                  </td>
                  <td>Não</td>
                  <td>Indicador de conclusão da tarefa (true/false)</td>
                </tr>
                <tr>
                  <td>
                    <code>estimated_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>Tempo estimado planejado em minutos (mínimo 5, máximo 240, inteiros)</td>
                </tr>
                <tr>
                  <td>
                    <code>actual_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>Tempo real consumido, acumulado automaticamente pelas sessões Pomodoro</td>
                </tr>
                <tr>
                  <td>
                    <code>completed_at</code>
                  </td>
                  <td>
                    <code>date</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Carimbo de data/hora do momento em que a tarefa foi marcada como concluída
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>order</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Índice sequencial de priorização manual definida via arrastar-e-soltar nas
                    visões Hoje, Amanhã e Inbox
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>tags</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Relação múltipla referenciando a coleção <code>tags</code> (maxSelect: 20,
                    cascadeDelete: false)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>recurrence_type</code>
                  </td>
                  <td>
                    <code>select</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Modalidade de recorrência: <code>none</code>, <code>daily</code>,{' '}
                    <code>weekly_days</code>, <code>weekly</code> ou <code>monthly</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>recurrence_interval</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Intervalo numérico da periodicidade (mínimo 1, default 1, apenas inteiros)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>recurrence_weekdays</code>
                  </td>
                  <td>
                    <code>json</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Lista de números correspondentes aos dias da semana (0=dom, 1=seg ... 6=sáb)
                    quando a modalidade é <code>weekly_days</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>recurrence_mode</code>
                  </td>
                  <td>
                    <code>select</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Origem do cálculo da próxima data: <code>from_date</code> (a partir do prazo) ou{' '}
                    <code>from_completion</code> (a partir da data em que foi concluída)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>due_time</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Horário agendado da tarefa em formato HH:MM (ex.: <code>14:30</code>,{' '}
                    <code>09:00</code>), utilizado para ordenação prioritária e disparos de alertas.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>priority</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Nível de prioridade da tarefa (inteiro 1 a 4: 1=P1 Champagne Ouro, 2=P2
                    Champagne Claro, 3=P3 Titânio, 4=P4 Grafite; 0 ou nulo = sem prioridade).
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>subtasks</code>
                  </td>
                  <td>
                    <code>json</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Lista ordenada de sub-tarefas (checklist) no formato <code>SubtaskItem[]</code>{' '}
                    (contendo <code>id: string</code>, <code>title: string</code> e{' '}
                    <code>done: boolean</code>). Permite edição inline, checklist no drawer e
                    herança limpa na recorrência.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps do ciclo de vida do registro</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="docs-indices">
            <span>ÍNDICES:</span> <code>idx_tasks_user (user)</code> ·{' '}
            <code>idx_tasks_due_date (due_date)</code> · <code>idx_tasks_done (done)</code> ·{' '}
            <code>idx_tasks_user_done_due (user, done, due_date)</code> ·{' '}
            <code>idx_tasks_user_order (user, order)</code>
          </div>
        </div>

        {/* COLEÇÃO: sessions */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">BASE COLLECTION</span>
              <h3>sessions</h3>
            </div>
            <div className="docs-rule-badge">
              <code>@request.auth.id != '' && user.id = @request.auth.id</code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Registro cronológico de blocos de foco do Pomodoro executados contra tarefas
            específicas.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>Identificador único do registro de sessão</td>
                </tr>
                <tr>
                  <td>
                    <code>task</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Não</td>
                  <td>
                    FK opcional vinculando a sessão à tarefa executada (cascadeDelete: true,
                    maxSelect: 1). Sessões de foco autônomo / livre são gravadas com{' '}
                    <code>task</code> nulo, permitindo anotação de notas e auditoria mesmo sem
                    vínculo com uma tarefa específica.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>user</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Sim</td>
                  <td>FK vinculando ao usuário proprietário (cascadeDelete: true)</td>
                </tr>
                <tr>
                  <td>
                    <code>started_at</code>
                  </td>
                  <td>
                    <code>date</code>
                  </td>
                  <td>Sim</td>
                  <td>Horário exato de início da sessão de foco</td>
                </tr>
                <tr>
                  <td>
                    <code>ended_at</code>
                  </td>
                  <td>
                    <code>date</code>
                  </td>
                  <td>Sim</td>
                  <td>Horário de término ou interrupção do bloco de trabalho</td>
                </tr>
                <tr>
                  <td>
                    <code>duration_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Duração efetiva computada em minutos com precisão decimal</td>
                </tr>
                <tr>
                  <td>
                    <code>session_date</code>
                  </td>
                  <td>
                    <code>date</code>
                  </td>
                  <td>Sim</td>
                  <td>Data da realização para agrupamento analítico e agregação no histórico</td>
                </tr>
                <tr>
                  <td>
                    <code>status</code>
                  </td>
                  <td>
                    <code>select</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Enumeração estrita: <code>completa</code> (atingiu os minutos do preset) ou{' '}
                    <code>interrompida</code> (concluída prematuramente)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>note</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Descrição textual opcional do que foi realizado no bloco de foco gravada pelo
                    campo &quot;O que foi feito?&quot; (máx. 500 caracteres, estilo TickTick),
                    persistida tanto em sessões vinculadas a tarefas quanto em sessões de foco
                    autônomo.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps de auditoria de sistema</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="docs-indices">
            <span>ÍNDICES:</span> <code>idx_sessions_user (user)</code> ·{' '}
            <code>idx_sessions_task (task)</code> · <code>idx_sessions_date (session_date)</code> ·{' '}
            <code>idx_sessions_user_date (user, session_date)</code>
          </div>
        </div>

        {/* COLEÇÃO: focus_presets */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">BASE COLLECTION</span>
              <h3>focus_presets</h3>
            </div>
            <div className="docs-rule-badge">
              <code>@request.auth.id != '' && user.id = @request.auth.id</code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Configurações e presets de temporização de foco do usuário, permitindo calibrar tempos
            de foco, descansos e blocos de ciclo.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>Identificador alfanumérico único do preset (15 chars)</td>
                </tr>
                <tr>
                  <td>
                    <code>name</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Nome do preset de foco (máx. 60 caracteres, ex.: &quot;Deep Work&quot;,
                    &quot;Estudo&quot;)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>user</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Sim</td>
                  <td>FK vinculando ao usuário proprietário (cascadeDelete: true)</td>
                </tr>
                <tr>
                  <td>
                    <code>work_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Duração do bloco de trabalho em minutos (default 25, mín. 5)</td>
                </tr>
                <tr>
                  <td>
                    <code>short_break_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Duração do descanso curto em minutos (default 5, mín. 5)</td>
                </tr>
                <tr>
                  <td>
                    <code>long_break_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Duração do descanso longo em minutos (default 15, mín. 5)</td>
                </tr>
                <tr>
                  <td>
                    <code>blocks_before_long_break</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Quantidade de blocos de foco antes do descanso longo (default 4, mín. 1)</td>
                </tr>
                <tr>
                  <td>
                    <code>archived</code>
                  </td>
                  <td>
                    <code>bool</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Indicador de arquivamento para ocultar da lista ativa sem perder histórico
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps de auditoria do preset</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="docs-indices">
            <span>ÍNDICES:</span> <code>idx_focus_presets_user (user)</code> ·{' '}
            <code>idx_focus_presets_user_archived (user, archived)</code>
          </div>
        </div>

        {/* COLEÇÃO: mcp_tokens */}
        <div className="docs-collection-card">
          <div className="docs-collection-header">
            <div>
              <span className="docs-collection-type">BASE COLLECTION (ETAPA 1 MCP)</span>
              <h3>mcp_tokens</h3>
            </div>
            <div className="docs-rule-badge">
              <code>
                @request.auth.id != '' && user.id = @request.auth.id (create: null/servidor)
              </code>
            </div>
          </div>
          <p className="docs-collection-desc">
            Tokens de acesso pessoal para clientes Model Context Protocol (Claude Code, Claude
            Desktop, Gemini CLI). Armazena apenas o hash criptográfico SHA-256 (o token cru{' '}
            <code>bs_mcp_...</code> é exibido apenas uma vez na criação).
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição / Restrições</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>id</code>
                  </td>
                  <td>
                    <code>text</code> (PK)
                  </td>
                  <td>Sim</td>
                  <td>Identificador alfanumérico primário gerado pelo PocketBase (15 chars)</td>
                </tr>
                <tr>
                  <td>
                    <code>name</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Rótulo descritivo do token (máx. 100 caracteres, ex: &quot;Claude Code&quot;,
                    &quot;Gemini CLI&quot;)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>user</code>
                  </td>
                  <td>
                    <code>relation</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    FK referenciando <code>users.id</code> (cascadeDelete: true, maxSelect: 1)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>token_hash</code>
                  </td>
                  <td>
                    <code>text</code>
                  </td>
                  <td>Sim</td>
                  <td>
                    Hash SHA-256 do token (máx. 128 chars). O valor cru nunca é persistido no banco.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>last_used_at</code>
                  </td>
                  <td>
                    <code>date</code>
                  </td>
                  <td>Não</td>
                  <td>Timestamp ISO do último uso bem-sucedido via header Authorization</td>
                </tr>
                <tr>
                  <td>
                    <code>revoked</code>
                  </td>
                  <td>
                    <code>bool</code>
                  </td>
                  <td>Não</td>
                  <td>
                    Indicador de revogação imediata (default: false). Tokens revogados retornam HTTP
                    403.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>created</code> / <code>updated</code>
                  </td>
                  <td>
                    <code>autodate</code>
                  </td>
                  <td>Automático</td>
                  <td>Timestamps de auditoria de geração e última alteração do token</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="docs-indices">
            <span>ÍNDICES:</span> <code>idx_mcp_tokens_hash (token_hash)</code> ·{' '}
            <code>idx_mcp_tokens_user (user)</code>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: CONECTAR AGENTES (MCP) */}
      <section className="docs-section" id="conectar-agentes-mcp">
        <div className="docs-section-header">
          <span className="docs-section-num">05</span>
          <div>
            <h2>Conectar Agentes (MCP — Model Context Protocol)</h2>
            <p>
              Integração oficial de Claude Code, Claude Desktop e Gemini CLI com o Barbosa System
            </p>
          </div>
        </div>

        <div className="docs-card" style={{ marginBottom: '24px' }}>
          <h3>Arquitetura do Servidor MCP (Etapas 1 e 2)</h3>
          <p>
            O Barbosa System expõe um servidor MCP oficial compatível com a especificação{' '}
            <strong>JSON-RPC 2.0</strong> via transporte <strong>Streamable HTTP</strong> no
            endpoint: <code>/backend/v1/mcp</code> (suporta requisições POST para invocar
            ferramentas e conexões GET para SSE). Todas as chamadas requerem o cabeçalho{' '}
            <code>Authorization: Bearer &lt;token&gt;</code> gerado na aba{' '}
            <em>Configurações &gt; Integrações & MCP</em>.
          </p>
          <p style={{ marginTop: '8px' }}>
            O servidor é <strong>estritamente multiusuário e auditável</strong>: o token identifica
            o proprietário e restringe qualquer leitura ou gravação às tarefas, listas, etiquetas e
            sessões pertencentes a essa conta. Na Etapa 2, o servidor passa a contar com{' '}
            <strong>10 ferramentas nativas</strong>, incluindo o parser em linguagem natural em
            português rodando 100% no servidor, checklist de sub-tarefas e gestão completa de
            etiquetas com metodologia 80/20.
          </p>
        </div>

        {/* RECEITAS PRONTAS */}
        <div className="docs-grid" style={{ marginBottom: '24px' }}>
          <article className="docs-card">
            <h3>1. Claude Code (CLI)</h3>
            <p>
              Adicione o servidor MCP ao Claude Code usando o comando <code>claude mcp add</code>{' '}
              com transporte HTTP e cabeçalho de autenticação:
            </p>
            <pre className="p-3 bg-[#121214] border border-[#27272A] rounded font-mono text-xs text-[#C5A880] overflow-x-auto my-3">
              <code>{`claude mcp add --transport http barbosa \\
  https://captura-de-tarefas-e-pomodoro-1239f.shrd00.internal.goskip.dev/backend/v1/mcp \\
  --header "Authorization: Bearer bs_mcp_SEU_TOKEN_AQUI"`}</code>
            </pre>
            <p className="text-xs text-[#A1A1AA]">
              Substitua <code>bs_mcp_SEU_TOKEN_AQUI</code> pelo token gerado nas Configurações.
            </p>
          </article>

          <article className="docs-card">
            <h3>2. Claude Desktop</h3>
            <p>
              No arquivo <code>claude_desktop_config.json</code> (no macOS:{' '}
              <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>; no
              Windows: <code>%APPDATA%\\Claude\\claude_desktop_config.json</code>):
            </p>
            <pre className="p-3 bg-[#121214] border border-[#27272A] rounded font-mono text-xs text-[#C5A880] overflow-x-auto my-3">
              <code>{`{
  "mcpServers": {
    "barbosa": {
      "url": "https://captura-de-tarefas-e-pomodoro-1239f.shrd00.internal.goskip.dev/backend/v1/mcp",
      "headers": {
        "Authorization": "Bearer bs_mcp_SEU_TOKEN_AQUI"
      }
    }
  }
}`}</code>
            </pre>
            <p className="text-xs text-[#A1A1AA]">
              Reinicie o Claude Desktop após salvar o arquivo para ativar as ferramentas.
            </p>
          </article>

          <article className="docs-card">
            <h3>3. Gemini CLI / Extensões MCP</h3>
            <p>
              Em clientes baseados em <code>settings.json</code> ou CLI com suporte a servidores MCP
              remotos HTTP:
            </p>
            <pre className="p-3 bg-[#121214] border border-[#27272A] rounded font-mono text-xs text-[#C5A880] overflow-x-auto my-3">
              <code>{`{
  "mcp": {
    "servers": {
      "barbosa-system": {
        "type": "http",
        "url": "https://captura-de-tarefas-e-pomodoro-1239f.shrd00.internal.goskip.dev/backend/v1/mcp",
        "headers": {
          "Authorization": "Bearer bs_mcp_SEU_TOKEN_AQUI"
        }
      }
    }
  }
}`}</code>
            </pre>
            <p className="text-xs text-[#A1A1AA]">
              Compatível com qualquer cliente que suporte Streamable HTTP / SSE JSON-RPC 2.0.
            </p>
          </article>

          <article className="docs-card">
            <h3>Exemplos de Prompts com IA</h3>
            <p>Interaja naturalmente com o seu assistente de IA conectado ao Barbosa System:</p>
            <ul className="text-xs text-[#A1A1AA] space-y-2 mt-2">
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;revisar contrato amanhã às 10h p1 @trabalho #jurídico&quot;
                </strong>
                <br />
                O assistente invoca <code>capture_task</code>. O parser do servidor interpreta a
                data de amanhã, horário 10:00, prioridade P1, etiqueta @trabalho e lista #jurídico,
                higienizando o título para &quot;revisar contrato&quot; e confirmando o resumo
                estruturado.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Adicione 3 sub-tarefas na tarefa do contrato: 1. Ler cláusulas rescisórias,
                  2. Validar multas, 3. Enviar ao sócio&quot;
                </strong>
                <br />
                O assistente chama <code>create_subtasks</code> com o <code>task_id</code> e a lista
                de itens, gravando no campo JSON <code>subtasks</code> compatível com os componentes
                visuais do app.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Marque a etiqueta @trabalho como foco prioritário 80/20&quot;
                </strong>
                <br />
                O assistente chama <code>manage_tags</code> com <code>action: &quot;pin&quot;</code>
                , ativando o selo prioritário e integrando a etiqueta ao cálculo do Big3 diário.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Liste todas as minhas etiquetas e quantas tarefas cada uma tem&quot;
                </strong>
                <br />
                O assistente chama <code>manage_tags</code> com{' '}
                <code>action: &quot;list&quot;</code>, retornando nomes, cores da paleta, status
                80/20 e contagem exata de tarefas atreladas.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Quais tarefas pendentes eu tenho para hoje?&quot;
                </strong>
                <br />
                O assistente chama <code>list_tasks</code> com <code>view: &quot;hoje&quot;</code> e
                resume suas prioridades.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Quanto foquei esta semana e qual é meu melhor dia?&quot;
                </strong>
                <br />
                O assistente chama <code>get_focus_summary</code> com{' '}
                <code>period: &quot;todos&quot;</code> e detalha seu recorde absoluto.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Conclua a tarefa de preparar o relatório&quot;
                </strong>
                <br />
                O assistente busca o ID e chama <code>complete_task</code>, avançando a recorrência
                se houver.
              </li>
              <li>
                <strong className="text-[#F4F4F5]">
                  &quot;Registre uma sessão de foco de 45 minutos com a nota 'Revisão das cláusulas
                  financeiras'&quot;
                </strong>
                <br />
                O assistente invoca <code>log_focus_session</code> vinculando tempo e descrição no
                histórico.
              </li>
            </ul>
          </article>
        </div>

        {/* AS 10 FERRAMENTAS MCP DO NÚCLEO (ETAPAS 1 E 2) */}
        <div className="docs-card">
          <h3>As 10 Ferramentas MCP Nativas (Etapas 1 e 2)</h3>
          <p className="mb-4">
            Todas as ferramentas são idempotentes, auditáveis e executadas no banco SQLite do
            PocketBase com as mesmas regras, campos e convenções do Barbosa System:
          </p>

          <div className="space-y-4">
            <div className="p-3 bg-[#121214] border border-[#C5A880]/30 rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">capture_task</code>
                <span className="text-[11px] text-[#C5A880] font-mono font-semibold">
                  ★ Nova (Etapa 2) — Parser NL no Servidor
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Captura uma nova tarefa a partir de texto em linguagem natural em português com
                parser nativo rodando diretamente no hook do PocketBase. Reconhece datas (
                <em>hoje</em>, <em>amanhã</em>, <em>12/11</em>, <em>15 de novembro</em>,{' '}
                <em>em 3 dias</em>, <em>próxima segunda</em>), horários (<em>às 10h</em>,{' '}
                <em>às 9h30</em>, <em>14:00</em>), recorrência (<em>todo dia</em>,{' '}
                <em>toda semana</em>, <em>toda segunda e quinta</em>, <em>todos os dias úteis</em>,{' '}
                <em>todo dia 15</em>, <em>a cada duas semanas</em>), prioridade (<em>p1..p4</em>,{' '}
                <em>!</em>, <em>!!</em>), etiquetas (<em>@nome</em>) e listas (<em>#nome</em>).
                Todos os tokens são removidos do título e a resposta devolve a tarefa persistida
                mais o resumo estruturado interpretado.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#C5A880]/30 rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">create_subtasks</code>
                <span className="text-[11px] text-[#C5A880] font-mono font-semibold">
                  ★ Nova (Etapa 2) — Checklist Estruturada
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Adiciona sub-tarefas (itens de checklist) a uma tarefa existente do usuário pelo{' '}
                <code>task_id</code>. Grava diretamente no campo JSON <code>subtasks</code> no
                padrão <code>&#123; id, title, done: false &#125;</code> utilizado pelo frontend e
                na herança de instâncias recorrentes. Suporta strings simples ou objetos com status
                e flag opcional <code>replace: true</code> para substituição integral.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#C5A880]/30 rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">manage_tags</code>
                <span className="text-[11px] text-[#C5A880] font-mono font-semibold">
                  ★ Nova (Etapa 2) — Gestão de Etiquetas & 80/20
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Gerenciamento completo das etiquetas do usuário autenticado via parâmetro{' '}
                <code>action</code>:
                <br />• <code>list</code>: lista todas as etiquetas com a contagem em tempo real de
                tarefas associadas e indicação de status 80/20.
                <br />• <code>create</code>: cria etiqueta com resolução case-insensitive e cor
                opcional da paleta Quiet Luxury.
                <br />• <code>rename</code> / <code>set_color</code>: atualiza nome ou cor de uma
                etiqueta existente pelo <code>id</code>.
                <br />• <code>pin</code> / <code>unpin</code>: ativa ou desativa o selo 80/20 (campo{' '}
                <code>pinned</code>), influenciando a priorização do Big3 diário.
                <br />• <code>delete</code>: desassocia a etiqueta de todas as tarefas existentes do
                usuário antes de excluí-la definitivamente, garantindo integridade referencial sem
                registros órfãos.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">create_task</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">Criação de tarefas</span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Cria uma nova tarefa no banco de dados. Parâmetros: <code>title</code>{' '}
                (obrigatório), <code>due_date</code> (YYYY-MM-DD), <code>due_time</code> (HH:MM),{' '}
                <code>priority</code> (1=P1 a 4=P4), <code>estimated_minutes</code> (5–240),{' '}
                <code>list</code> (nome legível da lista, criada se não existir) e <code>tags</code>{' '}
                (array de nomes de etiquetas, criadas se não existirem na paleta da casa).
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">list_tasks</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">Listagem com filtros</span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Consulta tarefas do usuário autenticado. Filtros opcionais: <code>view</code>{' '}
                (&quot;hoje&quot;, &quot;amanhã&quot;, &quot;inbox&quot;, &quot;semana&quot;),{' '}
                <code>date</code> (YYYY-MM-DD), <code>tag</code> (nome da etiqueta),{' '}
                <code>list</code> (nome da lista), <code>done</code> (boolean, padrão false) e{' '}
                <code>limit</code> (máx. 100, padrão 50).
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">complete_task</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">
                  Conclusão & Recorrência
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Marca a tarefa como concluída (<code>done = true</code>,{' '}
                <code>completed_at = now</code>). Se a tarefa possuir regra de recorrência (diária,
                semanal, dias específicos ou mensal), cria automaticamente a próxima instância
                calculada com a mesma lógica do aplicativo, preservando sub-tarefas e o histórico
                auditável.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">update_task</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">
                  Atualização de atributos
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Atualiza os dados de uma tarefa existente pelo <code>id</code>. Permite modificar{' '}
                <code>title</code>, <code>due_date</code>, <code>due_time</code>,{' '}
                <code>priority</code>, <code>estimated_minutes</code>, <code>list</code> e{' '}
                <code>tags</code>.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">delete_task</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">Exclusão permanente</span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Exclui definitivamente uma tarefa pertencente ao usuário a partir do seu{' '}
                <code>id</code>.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">get_focus_summary</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">
                  Métricas de Foco & Best-Day
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Retorna o volume de esforço focado em minutos e quantidade de sessões concluídas.
                Suporta <code>period: &quot;hoje&quot;</code>, <code>&quot;semana&quot;</code> e{' '}
                <code>&quot;todos&quot;</code>. Para o período integral, computa o recorde absoluto
                (melhor dia) do usuário em conformidade com o módulo <code>best-day</code>.
              </p>
            </div>

            <div className="p-3 bg-[#121214] border border-[#27272A] rounded">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[#C5A880] font-bold text-sm">log_focus_session</code>
                <span className="text-[11px] text-[#A1A1AA] font-mono">
                  Registro de Sessão Pomodoro
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Registra uma sessão concluída de foco (<code>status = &quot;completa&quot;</code>,{' '}
                <code>session_date = hoje</code>). Parâmetros: <code>duration_minutes</code>{' '}
                (obrigatório, &gt; 0), <code>task_id</code> (opcional, atualiza o{' '}
                <code>actual_minutes</code> da tarefa) e <code>note</code> (opcional, nota
                descritiva de até 500 caracteres).
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="docs-footer">
        <div className="docs-footer-inner">
          <BrandMark className="docs-footer-logo" />
          <p>
            BARBOSA SYSTEM · ARQUITETURA INTERNA DE SISTEMA · DESENVOLVIDO PARA MÁXIMA CLAREZA
            COGNITIVA
          </p>
        </div>
      </footer>
    </div>
  )
}

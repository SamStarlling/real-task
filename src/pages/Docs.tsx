import { BrandMark } from '@/components/Brand'

export function Docs() {
  return (
    <div className="page docs-page">
      <header className="view-title">
        <div>
          <span className="eyebrow">DOCUMENTAÇÃO DO SISTEMA</span>
          <h1 className="docs-heading">Barbosa System</h1>
        </div>
        <span className="docs-badge">VERSÃO INTERNA · V1.0</span>
      </header>

      <p className="docs-intro">
        O <strong>Barbosa System</strong> é uma plataforma minimalista de alto desempenho voltada à
        captura instantânea de tarefas, priorização diária e execução focada com temporizador
        Pomodoro integrado. Projetado com estética <em>quiet luxury</em>, tempo real bidirecional e
        dados 100% persistidos e isolados por usuário.
      </p>

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
                <strong>Datas relativas:</strong> reconhecimento de expressões como{' '}
                <code>hoje</code>, <code>amanhã</code> e <code>depois de amanhã</code>.
              </li>
              <li>
                <strong>Dias da semana e do mês:</strong> mapeamento de <code>segunda</code> a{' '}
                <code>domingo</code> (incluindo sufixo <code>-feira</code>) e formato{' '}
                <code>dia N</code> (ex.: <code>dia 15</code>), ajustando automaticamente para o
                meio-dia local e mês subsequente caso a data já tenha passado.
              </li>
              <li>
                <strong>
                  Prioridades P1–P4 via <code>p1–p4</code> ou <code>!</code>:
                </strong>{' '}
                suporte nativo na sintaxe da barra para priorização imediata (ex.: <code>p1</code>,{' '}
                <code>p2</code>, <code>p3</code>, <code>p4</code> ou exclamações como <code>!</code>
                ). O token é extraído do título final e exibe chip visual na barra com botão de
                remoção e popover flutuante para seleção manual de nível (P1–P4 ou Nenhuma).
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
                <strong>Histórico:</strong> registro auditável de esforço com painel analítico de 14
                dias e lista cronológica detalhada.
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
            <h3>Métricas e Análise Histórica com Meta Diária</h3>
            <p>Auditoria quantitativa do foco acumulado e acompanhamento de metas:</p>
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
                <strong>Leitura e atalho para Configurações:</strong> o cartão no Histórico opera em
                modo de visualização limpa, com botão <code>EDITAR METAS</code> que redireciona à
                seção dedicada em <code>/configuracoes</code>.
              </li>
              <li>
                <strong>Resumo numérico:</strong> cartões com totalização de foco para Hoje, Esta
                Semana e Tempo Total em Space Mono tabular.
              </li>
              <li>
                <strong>Histograma de 14 dias:</strong> gráfico de barras proporcional com escala
                calculada pelo pico do período e indicação abreviada dos dias da semana.
              </li>
              <li>
                <strong>Timeline de sessões:</strong> agrupamento por dia com horários de início e
                término, nome da tarefa relacionada, duração em minutos e etiqueta de status.
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
                <strong>Gerenciamento Completo de Etiquetas (/configuracoes):</strong> aba dedicada
                para administração integral das etiquetas da coleção <code>tags</code>. Permite
                criar com seletor visual da paleta <em>quiet luxury</em>, renomear inline com tecla
                Enter/Esc, alterar cor, inspecionar o código HEX e acompanhar o contador em tempo
                real de tarefas vinculadas a cada tag. Na exclusão, executa desassociação segura em
                cascata, removendo a referência do array de tags de todas as tarefas afetadas antes
                de deletar o registro.
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
                <td>Parser de Datas</td>
                <td>
                  <code>src/lib/date-parser.ts</code>
                </td>
                <td>Interno</td>
                <td>
                  Mecanismo autônomo regex de datas em português (hoje, amanhã, dias, semanas)
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
            <code>idx_tags_user (user)</code>
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
            <code>idx_lists_user (user)</code>
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

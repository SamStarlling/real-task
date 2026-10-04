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
                  Organização por listas via <code>#</code>:
                </strong>{' '}
                menu suspenso contextual com filtro dinâmico de listas existentes e opção
                instantânea de criar nova lista ao digitar.
              </li>
              <li>
                <strong>Seletor de minutos previstos:</strong> controle de passo (stepper) ajustável
                em intervalos de 5 min (mínimo 5 min, padrão 25 min, máximo 240 min).
              </li>
            </ul>
          </article>

          <article className="docs-card">
            <h3>Visões Temporais Estruturadas</h3>
            <p>Navegação rigorosamente ordenada por fluxo cognitivo de execução:</p>
            <ul>
              <li>
                <strong>Inbox:</strong> todas as tarefas capturadas sem data de vencimento
                atribuída. Serve como triagem primária de pendências.
              </li>
              <li>
                <strong>Hoje:</strong> visão principal do app. Agrupa tarefas agendadas para o dia e
                itens pendentes de dias anteriores (atrasadas). Inclui o indicador e barra de
                progresso <code>FOCO HOJE</code> (tempo real acumulado vs. tempo total estimado).
              </li>
              <li>
                <strong>Amanhã:</strong> preparação e visualização prévia da carga de trabalho do
                dia seguinte para redução de atrito matinal.
              </li>
              <li>
                <strong>Histórico:</strong> registro auditável de esforço com painel analítico de 14
                dias e lista cronológica detalhada.
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
            <h3>Pomodoro Avançado & Ciclo de Presets (/pomodoro)</h3>
            <p>
              Sistema completo de temporização inspirado na arquitetura de blocos do TickTick,
              integrado ao Design System Barbosa:
            </p>
            <ul>
              <li>
                <strong>
                  Página dedicada <code>/pomodoro</code>:
                </strong>{' '}
                layout em duas colunas com gerenciador de presets à esquerda (comutador
                Ativo/Arquivado, criação e edição inline), visão geral analítica à direita (4
                cartões de esforço acumulado e timeline cronológica de registros) e barra inferior
                fixa com display digital em Space Mono.
              </li>
              <li>
                <strong>
                  Presets customizáveis (<code>focus_presets</code>):
                </strong>{' '}
                suporte a durações arbitrárias de foco, descanso curto, descanso longo e cadência de
                blocos antes da pausa estendida (ex.: preset padrão Foco 25/5/15/4, Deep Work 50m,
                Estudo).
              </li>
              <li>
                <strong>Ciclos automáticos com Web Audio nativo:</strong> transição fluida entre
                blocos de trabalho e descansos, com sintetizador harmônico ascendente em Champagne
                ao concluir o foco e sinal discreto em dois tons ao encerrar o descanso, sem
                depender de arquivos externos.
              </li>
              <li>
                <strong>Contabilidade estrita:</strong> apenas blocos de foco registram sessões na
                coleção <code>sessions</code> e somam minutos ao <code>actual_minutes</code> da
                tarefa vinculada. Descansos não gravam registros espúrios.
              </li>
              <li>
                <strong>Timer global persistente:</strong> o temporizador mantém o estado unificado
                ao navegar por qualquer módulo do sistema (Hoje, Amanhã, Inbox, Histórico, Docs).
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
            <h3>Central de Configurações (Estilo Todoist)</h3>
            <p>Painel com navegação em duas colunas para objetivos e conta:</p>
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
            <code>idx_tasks_user_done_due (user, done, due_date)</code>
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
                  <td>Sim</td>
                  <td>FK vinculando a sessão à tarefa executada (cascadeDelete: true)</td>
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
                  <td>Duração do bloco de trabalho em minutos (default 25, mín. 1)</td>
                </tr>
                <tr>
                  <td>
                    <code>short_break_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Duração do descanso curto em minutos (default 5, mín. 1)</td>
                </tr>
                <tr>
                  <td>
                    <code>long_break_minutes</code>
                  </td>
                  <td>
                    <code>number</code>
                  </td>
                  <td>Sim</td>
                  <td>Duração do descanso longo em minutos (default 15, mín. 1)</td>
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

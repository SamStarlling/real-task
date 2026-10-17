/**
 * Fonte única da versão e metadados de versão da aplicação.
 * Atualizado a cada ciclo/entrega do Barbosa System.
 */
export const APP_VERSION = '0.0.59'
export const APP_VERSION_LABEL = `v${APP_VERSION}`

export interface ChangelogRelease {
  version: string
  title: string
  tag: string
  date?: string
  highlights: string[]
  details?: string
}

/**
 * Changelog oficial das entregas recentes do Pomodoro e do sistema (v0.0.40–v0.0.59).
 */
export const POMODORO_CHANGELOG: ChangelogRelease[] = [
  {
    version: '0.0.59',
    title: 'Pacote 3 Redesign: Respiro Geral dos Cards, Ações no Hover/Swipe e Foco Concentrado',
    tag: 'Redesign Pacote 3',
    date: '2025-05-18',
    highlights: [
      'Respiro geral dos cards em todas as telas (Hoje, Amanhã, Inbox, Semana, Projetos e Filtros): remoção definitiva do botão FOCUS permanente que ocupava a lateral direita de todos os itens.',
      'Estado padrão limpo (95% do tempo): o card exibe estritamente o conteúdo da tarefa — checkbox à esquerda, título com altura compacta, chips de metadados (@etiquetas, #projeto, P1–P4, recorrente, horário, sub-tarefas) e barra de progresso Previsto × Real.',
      'Ações suaves no Hover (Desktop): no padrão Todoist/Linear, botões discretos surgem à direita apenas ao passar o cursor sobre o card — FOCUS imediato com ícone de Play, seletor rápido de prioridade (P1 a P4) e atalho para abrir detalhes/editar.',
      'Gesto de Swipe no Mobile: em telas de toque (smartphones e tablets), deslizar o card para a direita revela a ação de FOCUS com feedback visual instantâneo.',
      'Painel de Detalhes como caminho alternativo: o drawer lateral de edição de tarefa traz o botão FOCUS em destaque como ação principal para iniciar o Pomodoro com um clique.',
      'Destaque permanente exclusivo na tarefa em foco: quando o cronômetro Pomodoro está rodando na tarefa, o card mantém destaque persistente (borda champagne iluminada e badge pulsante "EM FOCO") como informação operacional clara.',
      'Checkbox de conclusão intocado: clique direto no círculo de check continua concluindo e reabrindo tarefas instantaneamente sem qualquer interferência.',
      'Listas mais densas e ergonômicas com melhor aproveitamento do espaço vertical sem poluição visual.',
    ],
  },
  {
    version: '0.0.58',
    title: 'Pacotes 1+2 Redesign: Sidebar Ativa Exata, Inbox no Topo & Modal de Captura Global (C)',
    tag: 'Redesign UI/UX',
    highlights: [
      'Pacote 1 — Sidebar corrigida e reordenada: estado ativo por rota exata (apenas a visão, projeto ou etiqueta em foco acende a borda champagne, sem acender Hoje+Amanhã+Inbox conjuntamente).',
      'Nova ordem da seção VISÕES na barra lateral desktop e no drawer móvel: Inbox → Hoje → Amanhã → Semana.',
      'Pacote 2 — Captura por atalho global: remoção definitiva da barra de captura fixa do topo das telas, liberando espaço vertical e limpando a hierarquia das páginas.',
      'Novo Modal de Captura Global acionado pela tecla C em qualquer tela (com proteção contra digitação em inputs/textareas e fechamento no Esc).',
      'Dicas de sintaxe de linguagem natural integradas dentro do modal (p1–p4, @tag, #projeto, datas, horários, repetições e durações) em vez de poluírem permanentemente a tela.',
      'Banner sutil e minimalista no topo de descobribilidade ("Pressione C para capturar em qualquer tela") com acionador de clique.',
      'Mobile: botão flutuante FAB (+) unificado abrindo o mesmo modal global de captura.',
      'Preservação da captura rápida contextual inline nas seções de projetos (/projetos/:id) e na visão Semana.',
    ],
  },
  {
    version: '0.0.56',
    title: 'Estimativa Livre (1–600 min), Parser NL de Duração & Estimativa Opcional',
    tag: 'Estimativa Livre',
    highlights: [
      'Componente padrão EstimateInput (1–600 minutos) unificado na barra de captura do topo, gaveta de detalhes da tarefa (TaskDetail), visão Semana e captura inline de seções em Projetos.',
      'Aposentadoria dos antigos steppers fixos de 5 em 5 (teto 240) e do seletor rígido de 4 opções (15/25/50/90): entrada numérica livre com digitação direta ou botões de decremento/incremento fino.',
      'Chips de atalho rápido com durações ergonômicas (5m, 15m, 25m, 45m, 90m) e botão de ação rápida "Sem estimativa".',
      'Estimativa opcional na Inbox: tarefas podem ser criadas sem estimativa prévia (armazenada como 0 ou nulo no PocketBase); cartões mostram "EST. —" e o comparativo Previsto × Real exibe traço neutro sem distorcer barras.',
      'Aviso sutil champagne para tarefas longas (> 90 min): "90+ min? Considere quebrar a tarefa em partes menores" para incentivar decomposição de tarefas conforme boas práticas de produtividade.',
      'Parser de linguagem natural de duração (parsePortugueseDuration / cleanDurationToken no frontend e parseServerDuration no MCP hook): detecta expressões como "por 90 min", "treino por 1h30", "45min", "2h", "durante 1h15" sem colidir com horários agendados ("às 9h30").',
      'Migration 0024 no PocketBase: relaxamento do campo estimated_minutes na coleção tasks para min 0 e max 600, permitindo 0/null para tarefas livres.',
      'Servidor MCP atualizado em capture_task, create_task e update_task: suporte total a estimated_minutes de 1 a 600, 0 ou null, eliminando o fallback legado forçado de 25 minutos.',
    ],
  },
  {
    version: '0.0.54',
    title: 'Etapa 3 MCP: Planejamento Massivo por LLM com Projetos, Seções, Filtros & Veredito',
    tag: 'Servidor MCP & Automação',
    highlights: [
      'Exposição completa do campo description (até 5000 chars com links web e obsidian://) nas ferramentas create_task e update_task do MCP.',
      'Nova ferramenta manage_projects: gerenciamento integral de projetos (coleção lists) com meta/objetivo (goal), cor hex, descrição com link Obsidian, favoritos, arquivamento, sub-projetos hierárquicos e política segura de devolução de tarefas à Inbox na exclusão.',
      'Suporte a seções de projeto (project_sections) no MCP: criar frentes/áreas (Saúde, Sistemas, Prospecção) e alocar tarefas dinamicamente por nome/id de projeto e seção.',
      'Nova ferramenta manage_saved_filters: gerenciar e executar filtros salvos nos 5 eixos guiados (período, prioridade, etiqueta, projeto e status) com opção de fixar na sidebar (pinned) e matching dinâmico no servidor.',
      'Ampliação de log_focus_session: suporte nativo aos campos objective (âncora anti-drift) e outcome_status (veredito: batido, parcial, nao_foi), além de nova ferramenta get_focus_stats com quebra por tarefa (dados para o gráfico donut), total focado e taxas de sucesso.',
      'Mesclagem de etiquetas em manage_tags: ação "merge" para migrar todas as tarefas da etiqueta de origem para o destino com limpeza automática, além de listagem com contagem de abertas e cores.',
      'Filtros aprimorados em list_tasks: suporte direto a overdue (tarefas atrasadas), prioridades específicas (P1–P4) e seção de projeto para visões de planejamento executivo montadas por LLMs (Claude/Gemini).',
      'Documentação técnica (/dev) e Guia do Usuário (/guia) atualizados com especificações completas das 12 ferramentas MCP e exemplos de prompts em linguagem natural.',
    ],
  },
  {
    version: '0.0.53',
    title: 'Etapa 3 Todoist: Hub Etiquetas & Filtros Salvos Guiados',
    tag: 'Engenharia Todoist',
    highlights: [
      'Hub centralizado "Etiquetas & Filtros" (/filtros) acessível pela sidebar desktop, drawer mobile e atalhos rápidos.',
      'Gestão completa de Etiquetas: listagem unificada com paleta quiet luxury, contagens de tarefas abertas, criação, renomeação inline, troca de cor, exclusão segura (com aviso de desvinculação) e mesclagem de etiquetas com migração automática de tarefas.',
      'Filtros Salvos como visões dinâmicas: construtor guiado com período (Hoje, Amanhã, Esta semana, Atrasadas, Sem data ou Qualquer), prioridade (P1–P4 ou qualquer), etiqueta (qualquer, sem etiqueta ou específica), projeto e estado (abertas/concluídas).',
      'Página de execução de filtro com contagem de abertas/concluídas, critérios resumidos em Space Mono e visualização interativa com TaskCards completos.',
      'Persistência real no PocketBase (migration 0023): coleção saved_filters com regras estritas de isolamento por usuário (user.id = @request.auth.id), índices por usuário e pinned, e suporte a sincronização em tempo real (useRealtime).',
      'Integração na Sidebar e Drawer Mobile: filtros salvos fixados (pinned=true) aparecem automaticamente na seção FAVORITOS com ícone SlidersHorizontal e cor personalizada.',
    ],
  },
  {
    version: '0.0.52',
    title: 'Etapa 2 Todoist: Reestruturação da Sidebar e Favoritos Unificados',
    tag: 'Engenharia Todoist',
    highlights: [
      'Estrutura hierárquica Todoist de 4 seções na Sidebar desktop (≥1025px) e no Drawer Mobile: Visões → Favoritos → Projetos → Etiquetas.',
      'Seção VISÕES no topo: Hoje, Amanhã, Semana e Inbox com contagens à direita em Space Mono e estado colapsável persistido em localStorage.',
      'Seção FAVORITOS unificada: reúne projetos favoritos (favorite=true) e etiquetas pinadas (pinned=true) com contagem agregada e estado recolhível.',
      'Seção PROJETOS com suporte a sub-projetos aninhados (auto-relação parent), chevron de expandir/recolher filhos, dot de cor, ordenação (favoritos desc, depois ordem) e link rápido "Gerenciar projetos".',
      'Menu de contexto (...) nos itens da sidebar com ações rápidas: Fixar/Desafixar dos favoritos, Renomear com modal direto na sidebar e Arquivar projeto sem risco de exclusão acidental.',
      'Identidade visual dark/champagne Barbosa System (#090A0E/#12141C/#C5A880) preservada com destaque ativo champagne sutil.',
    ],
  },
  {
    version: '0.0.51',
    title: 'Etapa 1.5 Todoist: Descrição da Tarefa com Links Clicáveis & Correção de Metadados',
    tag: 'Engenharia Todoist',
    highlights: [
      'Etapa 1.5 Todoist: descrição da tarefa com links clicáveis (Obsidian/web), painel de detalhe com projeto e prazo em linha.',
      'Correção de tipagem estrita no cabeçalho de metadados do TaskDetail: conversão segura da string due_date em Date para formatShortDate.',
      'Parser de links com suporte total a URLs externas (http/https com target blank) e links nativos de notas no Obsidian (obsidian://).',
      'Edição ágil no drawer com auto-foco, atalhos Ctrl+Enter/Esc e preservação do fluxo rápido de captura.',
    ],
  },
  {
    version: '0.0.50',
    title: 'Etapa 1.5: Descrição da Tarefa Todoist & Links Clicáveis',
    tag: 'Engenharia Todoist',
    highlights: [
      'Migration 0022 adicionando campo description (texto longo opcional até 5000 caracteres) na coleção tasks no PocketBase com persistência e sincronização realtime.',
      'Bloco DESCRIÇÃO no painel de detalhe da tarefa (TaskDetail drawer) com rótulo em Space Mono, auto-expansão, atalhos de salvar (blur, botão ou Ctrl+Enter) e cancelar (Esc).',
      'Parser inteligente de links: URLs web (https://, http://) e protocolo nativo obsidian:// detectados automaticamente e transformados em links clicáveis com visual champagne.',
      'Abertura direta do Obsidian (obsidian://) sem embeds e links externos em nova aba segura (target="_blank" rel="noopener noreferrer").',
      'Cabeçalho de metadados do painel de detalhe unificado: Projeto com dot de cor dinâmico e seletor inline, e Prazo/Data em uma única linha clara.',
      'Captura rápida mantida ágil e veloz sem sobrecarga de campos; edição de contexto detalhado centralizada no drawer.',
    ],
  },
  {
    version: '0.0.49',
    title: 'Etapa 1: Arquitetura de Projetos Todoist & Seções',
    tag: 'Projetos Todoist',
    highlights: [
      'Evolução do schema PocketBase (migration 0021): coleção lists promovida a Projetos completos com cor personalizada, meta/objetivo mensurável do ciclo (goal), descrição com link Obsidian, favoritos, arquivamento e auto-relação para sub-projetos.',
      'Nova coleção project_sections com relacionamento de tarefas (campo section em tasks) para frentes/áreas (Saúde, Desenvolvimento, Prospecção) e rotinas (Diário, Semanal, Mensal).',
      'Página "Meus Projetos" (/projetos) com busca em tempo real, visual quiet luxury dark #090A0E + champagne #C5A880, barra de progresso de conclusão, agrupamento hierárquico pai-filho e gestão completa com política de segurança de tarefas órfãs.',
      'Página de Projeto Individual (/projetos/:id) com destaque do objetivo mensurável, link Obsidian clicável com suporte a protocolo nativo, calibração de prazo (Estimado × Realizado), seções dinâmicas e drag-and-drop de tarefas.',
      'Autocomplete de projetos via "#" na captura rápida contextual e integração na Sidebar com destaque no topo para favoritos.',
    ],
  },
  {
    version: '0.0.48',
    title: 'Atualização do Hub Técnico & Metadados',
    tag: 'Documentação & Versão',
    highlights: [
      'Centralização da versão da aplicação (APP_VERSION) como fonte única nos selos de /dev, /guia e /docs.',
      'Changelog técnico oficial integrando o ciclo completo do Pomodoro (v0.0.40 a v0.0.47) na documentação técnica.',
      'Saneamento dos marcadores estáticos de versão antiga em ferramentas MCP e destaques de arquitetura.',
    ],
  },
  {
    version: '0.0.47',
    title: 'Passo C: Painel Único Colapsável & Prep-bar Compacta',
    tag: 'Pomodoro Passo C',
    highlights: [
      'Painel único colapsável "Visão geral e Estatísticas" com abas Resumo Geral / Distribuição & Donut.',
      'Colapsamento automático ao iniciar foco mantendo resumo de uma linha quando recolhido, com expansão sob demanda.',
      'Prep-bar enxuta em cluster compacto com presets acessíveis em dropdown seletor limpo.',
    ],
  },
  {
    version: '0.0.46',
    title: 'Passo B: Duração Dinâmica & Controles no Hero',
    tag: 'Pomodoro Passo B',
    highlights: [
      'Duração dinâmica desacoplada do preset com draft persistido durante a sessão.',
      'Controles de duração (+/− e digitação direta de minutos) junto ao timer no hero e no widget flutuante.',
      'Presets transformados em atalhos inteligentes que aplicam durações sem travar ajustes manuais.',
    ],
  },
  {
    version: '0.0.45',
    title: 'Correção Estrutural do Card de Objetivo',
    tag: 'Correção & Layout',
    highlights: [
      'Remoção definitiva de duplicação do card OBJETIVO DO BLOCO.',
      'Migração do card de position:fixed para o fluxo normal do hero (posicionado logo abaixo da prep-bar).',
      'Correção e consistência nos placeholders e labels de objetivo em todos os estados.',
    ],
  },
  {
    version: '0.0.44',
    title: 'Etapa 4: Estatísticas & Gráfico Donut por Tarefa',
    tag: 'Pomodoro Etapa 4',
    highlights: [
      'Gráfico donut interativo de foco por tarefa desenvolvido com Recharts e paleta champagne ouro.',
      '5 métricas essenciais de disciplina do período: total focado, blocos, média por sessão, % de sessões completas e % de objetivos batidos.',
      'Filtros combinados na timeline (filtro por tarefa específica e status de conclusão/interrupção).',
      'Link cruzado integrado no Relatório Semanal para auditoria de produtividade.',
    ],
  },
  {
    version: '0.0.43',
    title: 'Etapa 3: Redesign Visual & Modo Foco em Tela Cheia',
    tag: 'Pomodoro Etapa 3',
    highlights: [
      'Redesign visual completo da página /pomodoro com timer central protagonista gigante em Clash Display e anel de progresso champagne.',
      'Barra de captura oculta automaticamente na página /pomodoro para foco sem distrações concorrentes.',
      'Modo Foco em Tela Cheia imersivo (#090A0E absoluto) com suporte ao atalho Esc para saída rápida.',
    ],
  },
  {
    version: '0.0.42',
    title: 'Etapa 2: Duração Livre, Presets Editáveis & Modo Stopwatch',
    tag: 'Pomodoro Etapa 2',
    highlights: [
      'Duração livre ajustável de 1 em 1 minuto (1–180 min para foco e 1–60 min para pausas).',
      'Presets editáveis, criáveis a partir do tempo atual e excluíveis (migration 0020 ajustando mínimo no PocketBase).',
      'Modo Stopwatch (contagem crescente contínua) com registro de tempo e veredito idênticos ao modo clássico.',
      'Paridade rigorosa entre página /pomodoro e widget flutuante, com sincronização em tempo real entre abas.',
    ],
  },
  {
    version: '0.0.41',
    title: 'Ajuste de Clareza do Objetivo do Bloco',
    tag: 'Pomodoro UX',
    highlights: [
      'Card com rótulo fixo "OBJETIVO DO BLOCO" e hierarquia tipográfica consistente.',
      'Título da tarefa exibido como valor editável inicial (não mero placeholder cinza).',
      'Pill indicador de objetivo durante o foco ativo, visível no widget flutuante e no painel pós-foco.',
    ],
  },
  {
    version: '0.0.40',
    title: 'Objetivo do Bloco, Veredito & Métrica Semanal',
    tag: 'Pomodoro Objetivo',
    highlights: [
      'Campos objective e outcome_status persistidos na coleção sessions (migration 0019).',
      'Captura estruturada de veredito (Batido / Parcial / Não foi) em todas as rotas de encerramento de foco.',
      'Filtro de data padrão de 7 dias na timeline de sessões do Pomodoro.',
      'Métrica de % de objetivos batidos integrada no Relatório Semanal.',
    ],
  },
]

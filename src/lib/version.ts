/**
 * Fonte única da versão e metadados de versão da aplicação.
 * Atualizado a cada ciclo/entrega do Barbosa System.
 */
export const APP_VERSION = '0.0.49'
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
 * Changelog oficial das entregas recentes do Pomodoro e do sistema (v0.0.40–v0.0.49).
 */
export const POMODORO_CHANGELOG: ChangelogRelease[] = [
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

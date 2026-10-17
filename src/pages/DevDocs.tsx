import { BrandMark } from '@/components/Brand'
import { CopyableBlock } from '@/components/docs/CopyableBlock'
import { DocSidebar, TocItem, useActiveSection } from '@/components/docs/DocSidebar'
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  History,
  Layers,
  Palette,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMcpServerUrl } from '@/services/mcp'
import { APP_VERSION_LABEL, POMODORO_CHANGELOG } from '@/lib/version'

const TOC_ITEMS: TocItem[] = [
  { id: 'comece-aqui', num: '00', title: 'Comece por aqui' },
  { id: 'mcp-arquitetura', num: '01', title: 'Servidor MCP & Conexões' },
  { id: 'mcp-ferramentas', num: '02', title: 'As 10 Ferramentas MCP' },
  { id: 'prompts-exemplos', num: '03', title: 'Receitas & Prompts IA' },
  { id: 'schema-banco', num: '04', title: 'Banco SQLite / PocketBase' },
  { id: 'design-tokens', num: '05', title: 'Design System & Breakpoints' },
  { id: 'stack-tecnica', num: '06', title: 'Stack & Arquitetura' },
  { id: 'changelog', num: '07', title: 'Changelog & Ciclos Pomodoro' },
]

export function DevDocs() {
  const activeSection = useActiveSection(
    TOC_ITEMS.map((item) => item.id),
    'comece-aqui',
  )

  const mcpUrl = getMcpServerUrl()

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
          DOCUMENTAÇÃO TÉCNICA · {APP_VERSION_LABEL.toUpperCase()}
        </span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-[#C5A880]" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#C5A880]">
            PARA DESENVOLVEDORES & INTEGRADORES
          </span>
        </div>
        <h1 className="font-['Clash_Display'] text-3xl sm:text-4xl font-semibold text-[#F4F4F6] tracking-tight">
          Integração, MCP e Arquitetura do Barbosa System
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#A1A1AA] max-w-3xl leading-relaxed">
          Referência técnica completa do servidor Model Context Protocol (JSON-RPC 2.0 / Streamable
          HTTP), especificações das 10 ferramentas nativas, schema relacional do PocketBase, regras
          de acesso (RLS) e design tokens <em>quiet luxury</em>.
        </p>
      </header>

      {/* CORPO COM SUMÁRIO LATERAL NAVEGÁVEL */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* SUMÁRIO LATERAL (MOBILE / DESKTOP) */}
        <DocSidebar items={TOC_ITEMS} activeId={activeSection} title="Módulos Técnicos" />

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* BLOCO 00: COMECE POR AQUI (5 PASSOS ESSENCIAIS PARA DEVS) */}
          <section id="comece-aqui" className="scroll-mt-6">
            <div className="p-6 rounded-2xl bg-[#12141C] border border-[#C5A880]/30 shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                  SETUP RÁPIDO
                </span>
                <span className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider">
                  Conexão em 5 passos
                </span>
              </div>
              <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6] mb-3">
                Comece por aqui em 5 passos (Setup MCP)
              </h2>
              <p className="text-sm text-[#A1A1AA] mb-6 leading-relaxed">
                Integre seu assistente (Claude Code, Claude Desktop ou Gemini CLI) ao Barbosa System
                em poucos minutos:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">01</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Gere seu token
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Vá em <em>Configurações &gt; Integrações & MCP</em> e crie um token (ex.:{' '}
                    <code>bs_mcp_...</code>).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">02</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Copie o Endpoint
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    O endpoint Streamable HTTP oficial é <code>/backend/v1/mcp</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">03</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Adicione ao Cliente
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Cole o comando pronto no seu terminal ou edite o arquivo JSON de configuração.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">04</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Valide Ferramentas
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Peça ao seu assistente para rodar <code>list_tasks</code> ou{' '}
                    <code>manage_tags</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[#27272A]">
                  <span className="font-mono text-xs font-bold text-[#C5A880] block mb-1">05</span>
                  <strong className="block text-xs font-semibold text-[#F4F4F6] mb-1">
                    Capture com NL
                  </strong>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Envie frases em linguagem natural via <code>capture_task</code> com parser do
                    servidor.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 01: SERVIDOR MCP E ARQUITETURA DE CONEXÃO */}
          <section id="mcp-arquitetura" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">01</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Servidor MCP Oficial (JSON-RPC 2.0 / Streamable HTTP)
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Arquitetura multiusuário com autenticação por token pessoal
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O Barbosa System expõe um servidor MCP oficial compatível com a especificação{' '}
                <strong>JSON-RPC 2.0</strong> via transporte <strong>Streamable HTTP</strong> no
                endpoint: <code>/backend/v1/mcp</code> (suporta requisições POST para invocar
                ferramentas e conexões GET para Server-Sent Events).
              </p>

              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#C5A880] font-semibold uppercase">
                    ENDPOINT DO SERVIDOR MCP
                  </span>
                  <span className="font-mono text-[11px] text-[#71717A]">
                    STREAMABLE HTTP / SSE
                  </span>
                </div>
                <code className="block font-mono text-xs text-[#F4F4F6] bg-[#12141C] p-2.5 rounded border border-[#1F2028] break-all">
                  {mcpUrl}
                </code>
                <p className="text-xs text-[#A1A1AA] pt-1">
                  Todas as chamadas requerem o cabeçalho{' '}
                  <code>Authorization: Bearer bs_mcp_...</code>. O token identifica o usuário e
                  restringe leitura/gravação ao seu próprio acervo.
                </p>
              </div>

              {/* RECEITAS PRONTAS DE CONEXÃO COM BOTÃO COPIAR */}
              <div className="space-y-4">
                <h3 className="font-['Clash_Display'] text-lg font-semibold text-[#F4F4F6]">
                  Receitas de Configuração Prontas
                </h3>

                {/* 1. CLAUDE CODE */}
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-[#C5A880]" />
                    <strong className="text-xs font-mono uppercase text-[#F4F4F6]">
                      1. Claude Code (CLI)
                    </strong>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mb-2">
                    Execute no terminal substituindo <code>bs_mcp_SEU_TOKEN_AQUI</code> pelo token
                    gerado:
                  </p>
                  <CopyableBlock
                    language="bash"
                    title="Comando CLI para Claude Code"
                    code={`claude mcp add --transport http barbosa \\
  ${mcpUrl} \\
  --header "Authorization: Bearer bs_mcp_SEU_TOKEN_AQUI"`}
                  />
                </div>

                {/* 2. CLAUDE DESKTOP */}
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-[#C5A880]" />
                    <strong className="text-xs font-mono uppercase text-[#F4F4F6]">
                      2. Claude Desktop (claude_desktop_config.json)
                    </strong>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mb-2">
                    macOS:{' '}
                    <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>
                    <br />
                    Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code>
                  </p>
                  <CopyableBlock
                    language="json"
                    title="Configuração JSON para Claude Desktop"
                    code={`{
  "mcpServers": {
    "barbosa": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer bs_mcp_SEU_TOKEN_AQUI"
      }
    }
  }
}`}
                  />
                </div>

                {/* 3. GEMINI CLI */}
                <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-[#C5A880]" />
                    <strong className="text-xs font-mono uppercase text-[#F4F4F6]">
                      3. Gemini CLI / Extensões MCP
                    </strong>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mb-2">
                    No arquivo de configuração do seu ambiente de extensões MCP:
                  </p>
                  <CopyableBlock
                    language="json"
                    title="Configuração para Gemini CLI / Outros clientes MCP"
                    code={`{
  "mcp": {
    "servers": {
      "barbosa-system": {
        "type": "http",
        "url": "${mcpUrl}",
        "headers": {
          "Authorization": "Bearer bs_mcp_SEU_TOKEN_AQUI"
        }
      }
    }
  }
}`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 02: AS 12 FERRAMENTAS MCP */}
          <section id="mcp-ferramentas" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">02</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Referência das Ferramentas MCP Nativas (Etapa 3 MCP)
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  12 ferramentas para planejamento executivo completo via LLMs (Claude & Gemini)
                </p>
              </div>
            </div>

            {/* TABELA COMPARATIVA RESUMIDA DAS FERRAMENTAS */}
            <div className="rounded-xl border border-[#27272A] overflow-hidden bg-[#12141C] mb-8">
              <div className="p-3.5 bg-[#0E1015] border-b border-[#1F2028]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                  Tabela Resumo: Servidor MCP do Barbosa System (12 Ferramentas)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#27272A] text-[#71717A] font-mono uppercase text-[11px]">
                      <th className="p-3 font-medium">Ferramenta</th>
                      <th className="p-3 font-medium">Finalidade</th>
                      <th className="p-3 font-medium">Parâmetros Principais</th>
                      <th className="p-3 font-medium">Retorno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2028]">
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880] font-bold">manage_projects</td>
                      <td className="p-3 text-[#E4E4E7]">Gestão total de projetos & seções</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        action (list, create, archive, delete, create_section...)
                      </td>
                      <td className="p-3 text-[#A1A1AA]">
                        Projetos, seções e tarefas devolvidas à Inbox na exclusão
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880] font-bold">
                        manage_saved_filters
                      </td>
                      <td className="p-3 text-[#E4E4E7]">Filtros salvos guiados nos 5 eixos</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        action (list, create, update, pin, execute), criteria
                      </td>
                      <td className="p-3 text-[#A1A1AA]">
                        Filtros salvos e tarefas que batem com os critérios
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880] font-bold">capture_task</td>
                      <td className="p-3 text-[#E4E4E7]">Parser NL completo no servidor</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">text (string)</td>
                      <td className="p-3 text-[#A1A1AA]">Tarefa persistida + resumo extraído</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880] font-bold">create_subtasks</td>
                      <td className="p-3 text-[#E4E4E7]">Adiciona itens de checklist</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">task_id, subtasks, replace?</td>
                      <td className="p-3 text-[#A1A1AA]">Array atualizado de subtasks</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880] font-bold">manage_tags</td>
                      <td className="p-3 text-[#E4E4E7]">Gestão de tags, 80/20 & mesclagem</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        action (list, pin, create, merge...), target_tag_id
                      </td>
                      <td className="p-3 text-[#A1A1AA]">
                        Tags com contagem e resultado de mesclagem
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">create_task</td>
                      <td className="p-3 text-[#E4E4E7]">
                        Criação com descrição, projeto, seção & estimativa livre
                      </td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        title, description, list, section, due_date, priority, estimated_minutes
                        (1–600 / null)
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Objeto TaskRecord criado</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">list_tasks</td>
                      <td className="p-3 text-[#E4E4E7]">
                        Consulta com filtros (overdue, P1-P4, seção)
                      </td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        view, overdue, priority, list, section, tag
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Lista de tarefas filtradas</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">complete_task</td>
                      <td className="p-3 text-[#E4E4E7]">Conclusão + avanço de recorrência</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">id</td>
                      <td className="p-3 text-[#A1A1AA]">
                        Tarefa fechada + nova instância (se recorrente)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">update_task</td>
                      <td className="p-3 text-[#E4E4E7]">
                        Atualização incluindo descrição, seção & estimativa livre
                      </td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        id, title, description, section, list, estimated_minutes (1–600 / 0 / null)
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Tarefa atualizada</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">delete_task</td>
                      <td className="p-3 text-[#E4E4E7]">Exclusão permanente</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">id</td>
                      <td className="p-3 text-[#A1A1AA]">Confirmação de exclusão</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">get_focus_summary</td>
                      <td className="p-3 text-[#E4E4E7]">Métricas de foco & Melhor Dia</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        period (hoje, semana, 30dias, todos), include_breakdown
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Minutos, sessões e recorde histórico</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">get_focus_stats</td>
                      <td className="p-3 text-[#E4E4E7]">
                        Estatísticas com quebra para gráfico Donut
                      </td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        period (hoje, semana, 30dias, todos)
                      </td>
                      <td className="p-3 text-[#A1A1AA]">
                        Top tarefas por tempo, % objetivos batidos e conclusão
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">log_focus_session</td>
                      <td className="p-3 text-[#E4E4E7]">
                        Registro Pomodoro com objetivo & veredito
                      </td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        duration_minutes, task_id?, note?, objective?, outcome_status?
                      </td>
                      <td className="p-3 text-[#A1A1AA]">
                        Sessão criada com veredito (batido/parcial/nao_foi)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETALHAMENTO DE CADA FERRAMENTA */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">manage_projects</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Novo na Etapa 3 MCP
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Gerenciamento integral de projetos (coleção <code>lists</code>) e seções (
                  <code>project_sections</code>). Permite listar com contagens de tarefas
                  abertas/concluídas, criar com cor hex, objetivo/meta (<code>goal</code>),
                  descrição rica com links Obsidian, favoritos, sub-projetos hierárquicos e exclusão
                  segura (devolve tarefas à Inbox com <code>list=null</code>). Permite criar
                  frentes/áreas em seções (ex.: Saúde, Sistemas, Diário).
                </p>
                <CopyableBlock
                  title="Exemplo: Criar projeto com meta e seções via MCP"
                  code={`{
  "name": "manage_projects",
  "arguments": {
    "action": "create",
    "name": "Ciclo 12 Semanas",
    "color": "#C5A880",
    "goal": "Lançar MVP e faturar R$10.000",
    "description": "Notas centrais em obsidian://open?vault=Vault&file=Ciclo-12-Semanas",
    "favorite": true
  }
}`}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">manage_saved_filters</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Novo na Etapa 3 MCP
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Gerencia e executa filtros salvos (coleção <code>saved_filters</code>) nos 5 eixos
                  guiados do Barbosa System: período (<code>today</code>, <code>tomorrow</code>,{' '}
                  <code>this_week</code>, <code>overdue</code>, <code>no_date</code>), prioridade
                  (0..4 ou <code>any</code>), etiqueta, projeto e status (<code>open</code>/
                  <code>done</code>/<code>any</code>). Permite fixar na sidebar (<code>pinned</code>
                  ) e rodar o filtro no servidor via <code>action: "execute"</code>.
                </p>
                <CopyableBlock
                  title="Exemplo: Criar e fixar filtro de tarefas atrasadas e urgentes"
                  code={`{
  "name": "manage_saved_filters",
  "arguments": {
    "action": "create",
    "name": "Críticas Atrasadas",
    "color": "#E57373",
    "pinned": true,
    "criteria": {
      "period": "overdue",
      "priority": 1,
      "status": "open"
    }
  }
}`}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">capture_task</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Parser NL Nativo & Duração Livre
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Executa o parser de linguagem natural nativo em português diretamente no hook do
                  PocketBase (<code>parseServerDuration</code>). Reconhece datas (<code>hoje</code>,{' '}
                  <code>amanhã</code>, <code>15/11</code>, <code>próxima segunda</code>), horários (
                  <code>às 14:00</code>, <code>9h30</code>), duração estimada em minutos ou horas (
                  <code>por 90 min</code>, <code>treino por 1h30</code>, <code>45min</code>,{' '}
                  <code>2h</code>), recorrência (<code>todo dia</code>, <code>toda semana</code>,{' '}
                  <code>todo dia 15</code>), prioridade (<code>p1..p4</code>), tags (
                  <code>@nome</code>) e listas/projetos (<code>#nome</code>). Não força fallback
                  legado de 25 min caso o usuário não informe duração.
                </p>
                <CopyableBlock
                  title="Exemplo de chamada JSON-RPC"
                  code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "capture_task",
    "arguments": {
      "text": "Revisar proposta técnica amanhã às 15h por 90 min p1 @trabalho #vendas"
    }
  },
  "id": 1
}`}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">
                    create_task / update_task
                  </code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Estimativa Livre 0–600 & Metadados Todoist
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  As ferramentas de criação e atualização suportam estimativa livre sem travas
                  rígidas de múltiplos de 5: o parâmetro <code>estimated_minutes</code> aceita
                  inteiros de <strong>1 a 600 minutos</strong> (até 10h), bem como{' '}
                  <strong>0</strong> ou <strong>null</strong> para representar tarefas sem
                  estimativa. Também incluem os parâmetros <code>description</code> (até 5000
                  caracteres, Markdown e links <code>obsidian://</code>) e <code>section</code> (ID
                  da seção no projeto).
                </p>
                <CopyableBlock
                  title="Exemplo com estimativa livre, descrição rica e seção"
                  code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_task",
    "arguments": {
      "title": "Arquitetar sincronização offline",
      "description": "Especificação técnica e protótipo inicial\\n- [ ] Definir cache\\n- [ ] Tratar conflitos",
      "list": "ID_DO_PROJETO_AQUI",
      "section": "ID_DA_SECAO_AQUI",
      "estimated_minutes": 135,
      "priority": 1
    }
  },
  "id": 2
}`}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">create_subtasks</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Checklist Estruturado
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Adiciona itens de checklist estruturados ao campo JSON <code>subtasks</code> de
                  uma tarefa. Compatível com os componentes visuais do app e herdado em tarefas
                  recorrentes.
                </p>
                <CopyableBlock
                  title="Exemplo de criação de checklist"
                  code={`{
  "name": "create_subtasks",
  "arguments": {
    "task_id": "RECORD_ID_AQUI",
    "subtasks": [
      "Ler cláusulas rescisórias",
      "Validar multas contratuais",
      "Enviar versão assinada"
    ],
    "replace": false
  }
}`}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">manage_tags</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Gestão 80/20 & Integridade
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Ações suportadas via parâmetro <code>action</code>: <code>list</code> (retorna
                  tags com contagem de tarefas em tempo real), <code>create</code> (com cor da
                  paleta da casa), <code>rename</code>, <code>pin</code> / <code>unpin</code> (ativa
                  marcador 80/20 que alimenta o Big3), e <code>delete</code> (desassocia tarefas
                  antes de excluir para evitar órfãos).
                </p>
                <CopyableBlock
                  title="Exemplo de ativação 80/20 (Pin tag)"
                  code={`{
  "name": "manage_tags",
  "arguments": {
    "action": "pin",
    "id": "TAG_ID_AQUI"
  }
}`}
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 03: RECEITAS E PROMPTS DE IA */}
          <section id="prompts-exemplos" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">03</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Exemplos de Prompts com IA Conectada
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Exemplos testados de interação conversacional direta
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <CopyableBlock
                title="Prompt: Criar projeto completo com meta, seções e notas Obsidian"
                code="Crie o projeto 'Lançamento Q3' com a meta 'Faturar R$50k', descrição com link para obsidian://open?vault=Principal&file=Q3-Roadmap, e monte 3 seções: 'Engenharia', 'Marketing' e 'Vendas'."
              />
              <CopyableBlock
                title="Prompt: Planejamento executivo de tarefas com descrição e seção"
                code="Crie uma tarefa 'Arquitetar servidor de notificações' dentro do projeto 'Lançamento Q3', seção 'Engenharia', prioridade P1, estimada em 45m, com descrição detalhada contendo requisitos técnicos e link de doc."
              />
              <CopyableBlock
                title="Prompt: Visão combinada de tarefas atrasadas e urgentes"
                code="Liste todas as tarefas pendentes que estão atrasadas com prioridade P1 (Urgente)."
              />
              <CopyableBlock
                title="Prompt: Criar filtro salvo e fixar na barra lateral"
                code="Crie um filtro salvo chamado 'Foco Imediato' com prioridade P1, período 'today', e fixe na minha sidebar."
              />
              <CopyableBlock
                title="Prompt: Registrar sessão de foco com âncora e veredito"
                code="Registre um bloco de foco de 50 minutos na tarefa 'Arquitetar servidor de notificações', com objetivo 'Finalizar spec de schemas' e veredito 'batido'."
              />
              <CopyableBlock
                title="Prompt: Estatísticas de foco do período e donut"
                code="Me mostre as estatísticas detalhadas de foco dos últimos 7 dias, taxa de objetivos batidos e a divisão de tempo por tarefa."
              />
              <CopyableBlock
                title="Prompt: Mesclagem de etiquetas duplicadas"
                code="Mescle a etiqueta 'backend-dev' para a etiqueta 'sistemas' e remova a etiqueta antiga."
              />
              <CopyableBlock
                title="Prompt: Captura com linguagem natural e metadados"
                code="Capture uma nova tarefa: 'Revisar contrato da parceria amanhã às 14h p1 @trabalho #juridico 45m'"
              />
              <CopyableBlock
                title="Prompt: Desdobrar tarefa existente em checklist"
                code="Na tarefa de 'Revisar contrato', adicione 3 sub-tarefas: 1. Checar cláusula de rescisão, 2. Alinhar honorários, 3. Disparar e-mail de fechamento."
              />
              <CopyableBlock
                title="Prompt: Concluir tarefa recorrente"
                code="Marque a tarefa 'Revisar métricas semanais' como concluída e me informe para qual data a próxima repetição foi agendada."
              />
            </div>
          </section>

          {/* SEÇÃO 04: BANCO SQLITE / POCKETBASE */}
          <section id="schema-banco" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">04</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Banco de Dados & Schema PocketBase
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  SQLite embarcado, isolamento estrito por usuário (RLS) e persistência 100% real
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <p>
                O sistema utiliza SQLite sob a camada Skip Cloud (PocketBase ~0.26.9). Todas as
                coleções implementam regras de isolamento estrito (
                <code>@request.auth.id != '' && user.id = @request.auth.id</code>). Nenhum usuário
                tem visibilidade sobre registros alheios.
              </p>

              {/* TABELA DE COLEÇÕES */}
              <div className="rounded-xl border border-[#27272A] overflow-hidden bg-[#12141C]">
                <div className="p-3.5 bg-[#0E1015] border-b border-[#1F2028]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Coleções de Domínio do Barbosa System
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#27272A] text-[#71717A] font-mono uppercase text-[11px]">
                        <th className="p-3 font-medium">Coleção</th>
                        <th className="p-3 font-medium">Tipo</th>
                        <th className="p-3 font-medium">Campos Chave</th>
                        <th className="p-3 font-medium">Regra de Acesso (RLS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2028]">
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">users</td>
                        <td className="p-3 text-[#A1A1AA]">auth</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          email, weekly_focus_goals, notification_preferences
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">tasks</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          title, description, due_date, due_time, priority, estimated_minutes (min:
                          0, max: 600, null permitido), list, section, order, subtasks, recurrence_*
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">tags</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">name, color, order, pinned</td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">lists (Projetos)</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          name, color, goal, description, favorite, archived, parent (auto-rel),
                          order, pinned
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">project_sections</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          name, project (relation → lists), order, user
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">sessions</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          task (opcional), duration_minutes, session_date, note, status, objective,
                          outcome_status
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">focus_presets</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          work_minutes (min: 1), short_break_minutes (min: 1), long_break_minutes
                          (min: 1), blocks_before_long_break (min: 1), archived
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">saved_filters</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          name, color, criteria (json), pinned, order, user
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">mcp_tokens</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          name, token_hash (SHA-256), last_used_at, revoked
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id (create: null/hook)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INDICES IMPORTANTES */}
              <div className="p-4 rounded-xl bg-[#090A0E] border border-[#27272A] font-mono text-xs space-y-1.5">
                <span className="text-[#C5A880] block mb-2 uppercase font-bold">
                  Índices Estruturais do Banco:
                </span>
                <div>
                  <code>
                    tasks: idx_tasks_user (user), idx_tasks_due_date (due_date),
                    idx_tasks_user_done_due (user, done, due_date), idx_tasks_user_order (user,
                    order)
                  </code>
                </div>
                <div>
                  <code>
                    tags: idx_tags_user_name (UNIQUE: user, name), idx_tags_user_pinned_order (user,
                    pinned, order)
                  </code>
                </div>
                <div>
                  <code>
                    saved_filters: idx_saved_filters_user (user), idx_saved_filters_user_pinned
                    (user, pinned)
                  </code>
                </div>
                <div>
                  <code>
                    lists: idx_lists_user_name (UNIQUE: user, name), idx_lists_user_pinned_order
                    (user, pinned, order), idx_lists_user_archived, idx_lists_user_favorite,
                    idx_lists_parent
                  </code>
                </div>
                <div>
                  <code>
                    project_sections: idx_sections_project_order (project, order), idx_sections_user
                    (user)
                  </code>
                </div>
                <div>
                  <code>
                    sessions: idx_sessions_user (user), idx_sessions_task (task),
                    idx_sessions_user_date (user, session_date)
                  </code>
                </div>
                <div>
                  <code>mcp_tokens: idx_mcp_tokens_hash (token_hash)</code>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 05: DESIGN SYSTEM & BREAKPOINTS */}
          <section id="design-tokens" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">05</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Design System Quiet Luxury, WCAG AA & Breakpoints
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Dark-first absoluto, contraste auditado e responsividade estrita
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#A1A1AA] leading-relaxed">
              <div className="rounded-xl border border-[#27272A] overflow-hidden bg-[#12141C]">
                <div className="p-3.5 bg-[#0E1015] border-b border-[#1F2028]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Tokens Oficiais de Cor do Barbosa System
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#27272A] text-[#71717A] font-mono uppercase text-[11px]">
                        <th className="p-3 font-medium">Token</th>
                        <th className="p-3 font-medium">Hex / Valor</th>
                        <th className="p-3 font-medium">Amostra</th>
                        <th className="p-3 font-medium">Uso Restrito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2028]">
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Carbono Obsidiana</td>
                        <td className="p-3 font-mono text-[#C5A880]">#090A0E</td>
                        <td className="p-3">
                          <span className="inline-block w-6 h-4 rounded border border-white/20 bg-[#090A0E]" />
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Fundo mestre, shell da aplicação e inputs primários
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Grafite Titânio</td>
                        <td className="p-3 font-mono text-[#C5A880]">#12141C</td>
                        <td className="p-3">
                          <span className="inline-block w-6 h-4 rounded border border-white/20 bg-[#12141C]" />
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Superfície de cartões, drawers e widget do Pomodoro
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Champagne Ouro Fosco</td>
                        <td className="p-3 font-mono text-[#C5A880]">#C5A880</td>
                        <td className="p-3">
                          <span className="inline-block w-6 h-4 rounded border border-white/20 bg-[#C5A880]" />
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Sotaque único metálico quente (CTAs, progresso, P1)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Platina Puro</td>
                        <td className="p-3 font-mono text-[#C5A880]">#F4F4F6</td>
                        <td className="p-3">
                          <span className="inline-block w-6 h-4 rounded border border-white/20 bg-[#F4F4F6]" />
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Texto primário, títulos em Clash Display
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Cinza Secundário WCAG AA</td>
                        <td className="p-3 font-mono text-[#C5A880]">#94949E</td>
                        <td className="p-3">
                          <span className="inline-block w-6 h-4 rounded border border-white/20 bg-[#94949E]" />
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          Rótulos de dados e cabeçalhos com contraste ≥4.5:1
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BREAKPOINTS */}
              <div className="rounded-xl border border-[#27272A] overflow-hidden bg-[#12141C]">
                <div className="p-3.5 bg-[#0E1015] border-b border-[#1F2028]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                    Escala de Resolução e Comportamento Responsivo
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#27272A] text-[#71717A] font-mono uppercase text-[11px]">
                        <th className="p-3 font-medium">Dispositivo</th>
                        <th className="p-3 font-medium">Viewport</th>
                        <th className="p-3 font-medium">Largura Máx.</th>
                        <th className="p-3 font-medium">Navegação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2028]">
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Smartphones</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">&le; 768px</td>
                        <td className="p-3 font-mono text-[#C5A880]">100%</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Bottom nav fixa (5 itens), FAB flutuante (+) e drawer
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Tablets / iPads</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">769px – 1024px</td>
                        <td className="p-3 font-mono text-[#C5A880]">Fluido</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Sidebar colapsável, cabeçalhos em grade 3 colunas
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Laptops Compactos</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">1025px – 1280px</td>
                        <td className="p-3 font-mono text-[#C5A880]">816px</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Sidebar fixa 260px, scroll contido na área útil
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Desktop Full HD</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">1281px – 1600px</td>
                        <td className="p-3 font-mono text-[#C5A880]">960px</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Grade ampla de 7 colunas perfeitamente visível
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#F4F4F6]">Monitores 27&quot; / 4K</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">&ge; 1601px</td>
                        <td className="p-3 font-mono text-[#C5A880]">1080px</td>
                        <td className="p-3 text-[#A1A1AA]">
                          Layout centralizado com limites estritos anti-dispersão
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 06: STACK TÉCNICA COMPLETA */}
          <section id="stack-tecnica" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">06</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Stack & Dependências de Produção
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Versões rigorosas ponta a ponta
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block mb-2 font-bold">
                  Frontend & Runtime
                </span>
                <ul className="space-y-1.5 text-[#D4D4D8]">
                  <li>
                    <code>React 19.2.7</code> — biblioteca de componentes
                  </li>
                  <li>
                    <code>Vite 8.0 / TypeScript 6.0</code> — build ESM ultra-rápido
                  </li>
                  <li>
                    <code>react-router-dom 7.18.2</code> — roteamento SPA
                  </li>
                  <li>
                    <code>Tailwind CSS 3.4.19</code> — design system dark
                  </li>
                  <li>
                    <code>lucide-react 0.577.0</code> — ícones vetoriais stroke-1.5
                  </li>
                  <li>
                    <code>recharts 2.15.4</code> — gráficos SVG de alta precisão (Donut / BarChart)
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block mb-2 font-bold">
                  Backend & Protocolos
                </span>
                <ul className="space-y-1.5 text-[#D4D4D8]">
                  <li>
                    <code>PocketBase ~0.26.9</code> — SQLite embarcado + Auth
                  </li>
                  <li>
                    <code>Server-Sent Events (SSE)</code> — realtime nativo PB
                  </li>
                  <li>
                    <code>Model Context Protocol (MCP)</code> — JSON-RPC 2.0 Streamable HTTP
                  </li>
                  <li>
                    <code>Web Audio API</code> — sintetização pura de acordes harmônicos
                  </li>
                  <li>
                    <code>BroadcastChannel</code> — trava de timer multi-abas
                  </li>
                  <li>
                    <code>weekly-report.ts</code> — motor de agregação semanal e cruzamento com
                    metas diárias
                  </li>
                  <li>
                    <code>FocusDistributionChart.tsx</code> — motor de agregação sob demanda de foco
                    por tarefa, fatias harmônicas e métricas de objetivos batidos
                  </li>
                  <li>
                    <code>EstimateInput.tsx</code> — controle padrão universal de estimativa livre
                    (1–600 min, chips 5/15/25/45/90, sem estimativa e aviso sutil champagne para
                    &gt; 90 min)
                  </li>
                  <li>
                    <code>date-parser.ts (parsePortugueseDuration)</code> — parser de duração em
                    linguagem natural com proteção contra falsos positivos de horários
                  </li>
                </ul>
              </div>
            </div>

            {/* ENGENHARIA DO PARSER DE DURAÇÃO E ESTIMATIVA LIVRE (V0.0.56) */}
            <div className="mt-4 p-4 rounded-xl bg-[#090A0E] border border-[#C5A880]/30 text-xs space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block font-bold">
                Engenharia do Parser de Duração & Estimativa Livre (v0.0.56 / Migration 0024)
              </span>
              <p className="text-[#A1A1AA] leading-relaxed">
                <strong>Algoritmo de Extração de Duração:</strong> O módulo{' '}
                <code>src/lib/date-parser.ts</code> implementa as funções{' '}
                <code>parsePortugueseDuration</code> e <code>cleanDurationToken</code> (espelhadas
                no hook PocketBase via <code>parseServerDuration</code>). O parser reconhece padrões
                como:
                <br />
                &bull; Minutos explícitos: <code>por 90 min</code>, <code>durante 45 min</code>,{' '}
                <code>45min</code>, <code>15m</code>;
                <br />
                &bull; Horas compostas e fracionadas: <code>1h30</code>, <code>por 1h30</code>,{' '}
                <code>1h15m</code>, <code>2h</code>, <code>durante 2 horas</code>;
                <br />
                &bull; <strong>Proteção estrita contra falsos positivos de horário:</strong>{' '}
                Expressões como <em>"às 9h30"</em>, <em>"as 14h"</em>, <em>"14:00"</em> e dígitos
                seguidos de pontuação horária são protegidos por lookaheads e validação de contexto
                antes do match de duração. O token de duração é limpo do título apenas quando de
                fato representa tempo de esforço previsto.
                <br />
                <strong>Schema e Relaxamento do Banco (Migration 0024):</strong> O campo{' '}
                <code>estimated_minutes</code> na coleção <code>tasks</code> foi expandido de{' '}
                <code>min: 5, max: 240</code> para <code>min: 0, max: 600</code>. Valores{' '}
                <code>null</code> ou <code>0</code> representam expressamente &quot;Sem
                estimativa&quot;, renderizados na interface como <code>EST. —</code> e no Previsto
                &times; Real como traço neutro sem distorcer barras ou gráficos.
              </p>
            </div>

            {/* ARQUITETURA DE FILTROS E ESTATÍSTICAS DO POMODORO (ETAPA 4) */}
            <div className="mt-4 p-4 rounded-xl bg-[#090A0E] border border-[#C5A880]/30 text-xs space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block font-bold">
                Arquitetura de Filtros e Estatísticas em /pomodoro (Etapa 4)
              </span>
              <p className="text-[#A1A1AA] leading-relaxed">
                <strong>Decisão de Coesão Visual e de Dados:</strong> O filtro de período (Hoje, 7
                dias, 30 dias, Tudo) alimenta tanto o gráfico de pizza/donut e métricas executivas
                quanto a lista base da timeline. Já os filtros granulares de <em>Tarefa</em> e{' '}
                <em>Status (completas / interrompidas)</em> afetam especificamente o detalhamento da
                lista cronológica (timeline), preservando o gráfico de pizza como a visão panorâmica
                holística do período selecionado. Dessa forma, o usuário pode analisar a composição
                geral de seu tempo no donut enquanto filtra e audita ocorrências pontuais na
                timeline. Ambas as agregações operam 100% no cliente com <code>useMemo</code>, sem
                requisições adicionais de backend.
              </p>
            </div>

            {/* ARQUITETURA DA SIDEBAR TODOIST (ETAPA 2 TODOIST) */}
            <div className="mt-4 p-4 rounded-xl bg-[#090A0E] border border-[#C5A880]/30 text-xs space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block font-bold">
                Engenharia da Sidebar Todoist & Árvore Hierárquica (Etapa 2 Todoist)
              </span>
              <p className="text-[#A1A1AA] leading-relaxed">
                <strong>Estrutura de 4 Seções Reativas:</strong> A barra lateral e o drawer móvel
                operam sob uma arquitetura de 4 blocos funcionais estritamente desacoplados:
                <br />
                1. <em>Visões:</em> Hoje, Amanhã, Semana e Inbox (sincronizadas com as rotas padrão
                e contagem de tarefas abertas).
                <br />
                2. <em>Favoritos:</em> União em memória dos registros de <code>lists</code> (onde{' '}
                <code>favorite === true</code>), <code>tags</code> (onde{' '}
                <code>pinned === true</code>) e <code>saved_filters</code> (onde{' '}
                <code>pinned === true</code>), preservando os listeners realtime via{' '}
                <code>useRealtime</code>.
                <br />
                3. <em>Projetos:</em> Construção de árvore pai-filho sob demanda com o campo{' '}
                <code>parent</code>, permitindo expandir/recolher subprojetos via localStorage e
                ações pontuais com <code>DropdownMenu</code>
                (fixar/desafixar, renomeação rápida em modal nativo e arquivamento seguro sem
                exclusão destrutiva).
                <br />
                4. <em>Etiquetas:</em> Preservação do drag-and-drop de reordenação (80/20) e
                contagem agregada de pendências.
              </p>
            </div>

            {/* ARQUITETURA DO HUB ETIQUETAS & FILTROS SALVOS (ETAPA 3 TODOIST) */}
            <div className="mt-4 p-4 rounded-xl bg-[#090A0E] border border-[#C5A880]/30 text-xs space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C5A880] block font-bold">
                Hub de Etiquetas & Filtros Salvos Guiados (Etapa 3 Todoist)
              </span>
              <p className="text-[#A1A1AA] leading-relaxed">
                <strong>Combinações Guiadas & Persistência Real:</strong> Diferente da sintaxe
                textual proprietária do Todoist, o Barbosa System implementa filtros salvos por meio
                de combinações guiadas de 5 critérios estruturados armazenados em JSON (
                <code>saved_filters.criteria</code>): período temporal (Hoje, Amanhã, Esta semana,
                Atrasadas, Sem data), prioridade (P1–P4), etiqueta vinculada, projeto e estado de
                conclusão. A avaliação é client-side em tempo real via{' '}
                <code>taskMatchesFilterCriteria</code>, assegurando consistência total com os dados
                locais e zero overhead em requisições de rede. Filtros salvos podem ser pinados para
                a seção Favoritos da sidebar com indicador visual próprio. A gestão de etiquetas
                permite renomear, reatribuir cor, mesclar etiquetas migrando tarefas automaticamente
                e exclusão com segurança referencial (desvinculação sem perda de tarefas).
              </p>
            </div>
          </section>

          {/* SEÇÃO 07: CHANGELOG DAS ENTREGAS DO POMODORO & SISTEMA */}
          <section id="changelog" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">07</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Changelog Técnico & Entregas (v0.0.40–v0.0.56)
                </h2>{' '}
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Histórico de arquitetura, engenharia reversa Todoist/TickTick e refinamentos
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {POMODORO_CHANGELOG.map((item) => (
                <div
                  key={item.version}
                  className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#27272A] hover:border-[#C5A880]/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#C5A880] px-2 py-0.5 rounded bg-[#C5A880]/15 border border-[#C5A880]/30">
                        v{item.version}
                      </span>
                      <h3 className="font-['Clash_Display'] text-sm sm:text-base font-semibold text-[#F4F4F6]">
                        {item.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#A1A1AA] px-2 py-0.5 rounded bg-[#1F2028]">
                      {item.tag}
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-[#D4D4D8] list-disc list-inside">
                    {item.highlights.map((highlight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* RODAPÉ DO DEV COM LINK CRUZADO PARA O GUIA DO USUÁRIO */}
          <footer className="pt-10 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-[#71717A] uppercase tracking-wider block mb-1">
                Quer ver como o usuário final usa o sistema?
              </span>
              <p className="text-xs text-[#A1A1AA] m-0">
                Consulte o guia orientado a tarefas do dia a dia, sem termos técnicos.
              </p>
            </div>
            <Link
              to="/guia"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12141C] hover:bg-[#181A22] text-[#C5A880] border border-[#C5A880]/30 hover:border-[#C5A880]/60 text-xs font-mono transition-colors flex-none"
            >
              <span>Ir para /guia (Usuário)</span>
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

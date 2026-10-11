import { BrandMark } from '@/components/Brand'
import { CopyableBlock } from '@/components/docs/CopyableBlock'
import { DocSidebar, TocItem, useActiveSection } from '@/components/docs/DocSidebar'
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  Layers,
  Palette,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMcpServerUrl } from '@/services/mcp'

const TOC_ITEMS: TocItem[] = [
  { id: 'comece-aqui', num: '00', title: 'Comece por aqui' },
  { id: 'mcp-arquitetura', num: '01', title: 'Servidor MCP & Conexões' },
  { id: 'mcp-ferramentas', num: '02', title: 'As 10 Ferramentas MCP' },
  { id: 'prompts-exemplos', num: '03', title: 'Receitas & Prompts IA' },
  { id: 'schema-banco', num: '04', title: 'Banco SQLite / PocketBase' },
  { id: 'design-tokens', num: '05', title: 'Design System & Breakpoints' },
  { id: 'stack-tecnica', num: '06', title: 'Stack & Arquitetura' },
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
          DOCUMENTAÇÃO TÉCNICA · V0.0.34
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

          {/* SEÇÃO 02: AS 10 FERRAMENTAS MCP */}
          <section id="mcp-ferramentas" className="scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-[#27272A] pb-3 mb-6">
              <span className="font-mono text-xl font-bold text-[#C5A880]">02</span>
              <div>
                <h2 className="font-['Clash_Display'] text-2xl font-semibold text-[#F4F4F6]">
                  Referência das 10 Ferramentas MCP Nativas
                </h2>
                <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                  Operações idempotentes, auditáveis e executadas no SQLite sob Row-Level Security
                </p>
              </div>
            </div>

            {/* TABELA COMPARATIVA RESUMIDA DAS 10 FERRAMENTAS */}
            <div className="rounded-xl border border-[#27272A] overflow-hidden bg-[#12141C] mb-8">
              <div className="p-3.5 bg-[#0E1015] border-b border-[#1F2028]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#F4F4F6] font-semibold">
                  Tabela Resumo: As 10 Ferramentas do Servidor MCP
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
                      <td className="p-3 text-[#E4E4E7]">Gestão completa de tags & 80/20</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        action (list, pin, create, etc)
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Tags com contagem e status pinned</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">create_task</td>
                      <td className="p-3 text-[#E4E4E7]">Criação estruturada direta</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        title, due_date, priority, tags...
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Objeto TaskRecord criado</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">list_tasks</td>
                      <td className="p-3 text-[#E4E4E7]">Consulta com filtros</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">view, date, tag, list, done</td>
                      <td className="p-3 text-[#A1A1AA]">Lista de tarefas filtradas</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">complete_task</td>
                      <td className="p-3 text-[#E4E4E7]">Conclusão + avanço de recorrência</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">task_id</td>
                      <td className="p-3 text-[#A1A1AA]">
                        Tarefa fechada + nova instância (se recorrente)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">update_task</td>
                      <td className="p-3 text-[#E4E4E7]">Atualização parcial de campos</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        id, title, due_time, priority...
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
                      <td className="p-3 font-mono text-[#A1A1AA]">period (hoje, semana, todos)</td>
                      <td className="p-3 text-[#A1A1AA]">Minutos, sessões e recorde histórico</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A880]">log_focus_session</td>
                      <td className="p-3 text-[#E4E4E7]">Registro de sessão Pomodoro</td>
                      <td className="p-3 font-mono text-[#A1A1AA]">
                        duration_minutes, task_id?, note?
                      </td>
                      <td className="p-3 text-[#A1A1AA]">Sessão criada e tempo somado na tarefa</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETALHAMENTO DE CADA FERRAMENTA */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">capture_task</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Destaque v0.0.34
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Executa o parser de linguagem natural nativo em português diretamente no hook do
                  PocketBase. Reconhece datas (<code>hoje</code>, <code>amanhã</code>,{' '}
                  <code>15/11</code>, <code>próxima segunda</code>), horários (<code>às 14:00</code>
                  ), recorrência (<code>todo dia</code>, <code>toda semana</code>,{' '}
                  <code>todo dia 15</code>), prioridade (<code>p1..p4</code>), tags (
                  <code>@nome</code>) e listas (<code>#nome</code>).
                </p>
                <CopyableBlock
                  title="Exemplo de chamada JSON-RPC"
                  code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "capture_task",
    "arguments": {
      "text": "Enviar proposta comercial amanhã às 15h p1 @trabalho #vendas"
    }
  },
  "id": 1
}`}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#12141C] border border-[#C5A880]/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="text-[#C5A880] font-bold text-sm">create_subtasks</code>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880]">
                    Destaque v0.0.34
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
                title="Prompt: Captura com linguagem natural e metadados"
                code="Capture uma nova tarefa: 'Revisar contrato da parceria amanhã às 14h p1 @trabalho #juridico 45m'"
              />
              <CopyableBlock
                title="Prompt: Desdobrar tarefa existente em checklist"
                code="Na tarefa de 'Revisar contrato', adicione 3 sub-tarefas: 1. Checar cláusula de rescisão, 2. Alinhar honorários, 3. Disparar e-mail de fechamento."
              />
              <CopyableBlock
                title="Prompt: Consultar prioridades do dia"
                code="Quais são as minhas tarefas de Hoje e qual é a lista do meu Big3 prioritário?"
              />
              <CopyableBlock
                title="Prompt: Consultar recorde e foco acumulado"
                code="Quanto tempo de foco eu acumulei esta semana e qual é meu melhor dia histórico registrado?"
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
                          title, due_date, due_time, priority, order, subtasks, recurrence_*
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
                        <td className="p-3 font-mono text-[#C5A880] font-bold">lists</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">name, order, pinned</td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">sessions</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          task (opcional), duration_minutes, session_date, note, status
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#A1A1AA]">
                          user.id = @request.auth.id
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-[#C5A880] font-bold">focus_presets</td>
                        <td className="p-3 text-[#A1A1AA]">base</td>
                        <td className="p-3 font-mono text-[#A1A1AA]">
                          work_minutes, short_break_minutes, long_break_minutes,
                          blocks_before_long_break
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
                    lists: idx_lists_user_name (UNIQUE: user, name), idx_lists_user_pinned_order
                    (user, pinned, order)
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
                </ul>
              </div>
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

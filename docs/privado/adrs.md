# Registro de Decisões de Arquitetura (ADRs) — Barbosa System

> **Aviso de Confidencialidade**: Documentação interna — não expor a clientes/usuários.

Este documento registra as decisões formais de arquitetura de software, design de produto e infraestrutura tomadas ao longo do desenvolvimento do Barbosa System.

---

## ADR-001: PocketBase (Skip Cloud) como Backend Multiusuário com RLS

### Contexto

O Barbosa System precisava de um backend rápido de iterar, com banco relacional confiável, autenticação pronta, suporte a eventos em tempo real (WebSocket) e regras de segurança rígidas por usuário, sem incorrer na sobrecarga de manutenção de uma infraestrutura tradicional de microserviços.

### Decisão

Adotar o **PocketBase** hospedado no Skip Cloud. O acesso é governado por regras de API em nível de registro (Row-Level Security):

- Cada coleção possui restrições como `@request.auth.id != '' && user.id = @request.auth.id`.
- Mudanças estruturais de banco ocorrem estritamente via migrações versionadas em JavaScript (`pocketbase/migrations/`).
- O isolamento entre inquilinos é garantido na camada do banco, blindando os dados contra vazamentos horizontais.

### Consequências

- **Positivas**: Ciclos de entrega extremamente rápidos, tipagem sincronizada, reatividade em tempo real nativa com `useRealtime` e banco SQLite de baixa latência.
- **Negativas / Limitações**: Consultas analíticas pesadas precisam ser modeladas de maneira orientada a filtros do PocketBase ou pré-computadas no cliente.

---

## ADR-002: Stack Frontend React + Vite + TypeScript + Tailwind CSS / shadcn/ui

### Contexto

O aplicativo exige fluidez equivalente a um software desktop, alta performance em animações de timer, renderização instantânea de centenas de itens de lista e consistência rigorosa de componentes visuais.

### Decisão

Utilizar **React 18** com **Vite** para empacotamento rápido, **TypeScript** estrito e o design kit **Tailwind CSS** complementado com os utilitários do **shadcn/ui**.

### Consequências

- **Positivas**: Build rápido, tipagem estática que previne quebras de contrato de dados, ergonomia de estilização e liberdade de customização direta no código dos componentes sem dependências externas opacas.
- **Negativas**: Exige disciplina de componentização para evitar arquivos de visualização excessivamente longos.

---

## ADR-003: Identidade Visual Dark First com Acento Champagne Único e Tipografia Singular

### Contexto

Ferramentas de foco e Pomodoro são frequentemente utilizadas em ambientes de trabalho prolongado. Interfaces claras ou multicoloridas causam fadiga visual e dispersão de atenção, competindo com as tarefas que o usuário precisa executar.

### Decisão

Padronizar a interface sob a premissa **Dark First**:

- Fundo profundo `#090A0E` e painéis em `#12141C` com bordas sutis `#27272A`.
- Acento de destaque único em tom **Champagne** (`#C5A880`), utilizado com moderação para sinalizar ações ativas, foco e recordes.
- Tipografia em três camadas funcionais:
  - **Clash Display**: Títulos principais e numerais com personalidade e autoridade executiva.
  - **Plus Jakarta Sans**: Corpo de texto com legibilidade ergonômica.
  - **Space Mono**: Indicadores temporais, contadores, chips de metadata e comandos de terminal.

### Consequências

- **Positivas**: Estética profissional, foco visual imediato nas tarefas ativas e redução expressiva da poluição de cores.
- **Negativas**: Exige cuidado contínuo com contraste em badges coloridas de etiquetas para atender aos critérios WCAG AA.

---

## ADR-004: Sub-tarefas como Campo JSON em Tasks em vez de Coleção Relacional Própria

### Contexto

O suporte a sub-tarefas (checklists dentro de uma tarefa) poderia ser modelado de duas formas: uma tabela relacional separada (`subtasks` com chave estrangeira para `tasks`) ou um campo de array estruturado em JSON na própria entidade `tasks`.

### Decisão

Persistir sub-tarefas como um **campo JSON (`subtasks`)** embutido na tabela `tasks`.

### Consequências

- **Positivas**:
  - Atualizações, reordenações e adições ocorrem em uma **única transação atômica** via `updateTask(taskId, { subtasks })`.
  - Elimina requisições extras de junção (_joins_ ou _expands_) ao renderizar a lista de tarefas, melhorando a responsividade.
  - Simplifica a duplicação em tarefas recorrentes (`resetSubtasksForRecurrence`), bastando manipular o array antes da inserção.
- **Negativas**: Não é possível fazer consultas diretas no banco buscando apenas por uma sub-tarefa específica sem carregar a tarefa mãe. No modelo de uso de produtividade pessoal, esse cenário é desnecessário.

---

## ADR-005: Captura em Linguagem Natural com Parser Dual (Cliente e Servidor MCP)

### Contexto

A entrada rápida de tarefas precisa interpretar comandos cotidianos em Português (ex: `"Reunião com diretoria amanhã 15h #trabalho @importante ~30m"`). Usuários utilizam tanto a interface web/mobile quanto assistentes externos de IA conectados ao MCP.

### Decisão

Implementar a inteligência do parser em duas frentes alinhadas:

1. **No Cliente (`src/lib/date-parser.ts`)**: Para feedback visual instantâneo e _preview_ interativo dos tokens enquanto o usuário digita no app.
2. **No Servidor / Hooks (`src/lib/mcp-server-parser.ts` e `pocketbase/hooks/mcp_server.pb.js`)**: Para que assistentes Claude Desktop, Cursor e Claude Code criem tarefas estruturadas a partir de frases completas sem depender do cliente web.

### Consequências

- **Positivas**: Experiência consistente tanto para o usuário humano quanto para agentes de inteligência artificial.
- **Negativas**: Alterações em padrões gramaticais de data/hora exigem sincronização entre os arquivos de parser cliente e backend.

---

## ADR-006: Servidor MCP Nativo em Hooks PocketBase com Prefixo /backend/v1/ e Autenticação por Tokens com Hash SHA-256

### Contexto

A integração com assistentes de IA (Claude, Gemini, etc.) requer conformidade com a especificação Model Context Protocol (MCP). O PocketBase no Skip Cloud precisava expor uma rota HTTP para o protocolo com controle de acesso rigoroso por usuário.

### Decisão

Implementar o servidor MCP nativamente em JavaScript nos hooks do backend (`pocketbase/hooks/mcp_server.pb.js`):

- Todas as rotas customizadas de backend devem adotar o prefixo obrigatório `/backend/v1/` (ex: `/backend/v1/mcp` e `/backend/v1/mcp-tokens`).
- A autenticação externa usa **Tokens de Acesso Pessoal (PAT)** gerados sob demanda no perfil do usuário. O banco armazena estritamente o hash criptográfico **SHA-256** do token (`mcp_tokens`), garantindo que o token original seja exibido apenas uma vez na criação.
- Limitação documentada: Não foi implementado fluxo OAuth completo; portanto, clientes que exigem OAuth rígido em nuvem (como Claude Web Connectors) dependem de evolução futura. Para Claude Code, Claude Desktop e scripts locais, a autenticação por Bearer token funciona nativamente.

### Consequências

- **Positivas**: 10 ferramentas de produtividade expostas sem necessidade de container ou servidor Node.js externo; isolamento dos dados do usuário via token do backend; alta velocidade.
- **Negativas**: Clientes web com exigência exclusiva de OAuth externo não conseguem se conectar de imediato.

---

## ADR-007: Ordem Sequencial como Critério de Prioridade no Princípio 80/20

### Contexto

Sistemas tradicionais utilizam etiquetas estáticas como "Alta", "Média" e "Baixa", que rapidamente perdem utilidade porque os usuários tendem a marcar quase tudo como prioridade máxima.

### Decisão

Adotar a **posição na lista/sidebar** como definição dinâmica de prioridade:

- As listas e etiquetas possuem um atributo numérico sequencial `order` e um atributo booleano `pinned`.
- Os itens fixados no topo (`pinned = true` e menor `order`) definem o escopo dos 80% de impacto.
- Tarefas vinculadas a essas fontes assumem automaticamente prioridade para preencher o cartão Big3. Prioridades P1–P4 existem apenas como critério complementar de ordenação fina interna.

### Consequências

- **Positivas**: Elimina a inflação de prioridades; reorganizar a sidebar reorganiza automaticamente o foco do dia todo.
- **Negativas**: Usuários não acostumados com o método precisam de um período breve de assimilação (endereçado no Guia do Usuário).

---

## ADR-008: Documentação Privada da Empresa no Repositório GitHub em vez de Área Autenticada no Frontend

### Contexto

A documentação do Barbosa System foi dividida em três audiências:

1. Usuário final (`/guia` no app).
2. Desenvolvedores externos e integração MCP (`/dev` no app).
3. Documentação interna corporativa (estratégia de negócio, ADRs, regras consolidadas, finanças e roadmap futuro).
   Criar uma área protegida para a documentação corporativa dentro do frontend exigiria perfis de administração (_RBAC_), controle de papéis no banco de dados e rotas autenticadas especiais que aumentariam a superfície de ataque e o tamanho do bundle.

### Decisão

Armazenar a documentação corporativa e estratégica **exclusivamente na pasta `docs/privado/` do repositório privado do GitHub**. A proteção de acesso é a própria segurança de credenciais do repositório versionado (GitHub). Nenhuma rota especial, página de login de administrador ou autenticação de doc interna foi adicionada ao frontend.

### Consequências

- **Positivas**:
  - Complexidade zero adicionada ao código de produção do aplicativo.
  - Impossibilidade de vazamento acidental de estratégias internas via inspeção de arquivos ou rede no navegador.
  - Edição natural por desenvolvedores e gestores via Markdown, Git e Pull Requests.
- **Negativas**: Pessoas não técnicas da empresa necessitam de acesso concedido ao repositório GitHub para leitura dos documentos.

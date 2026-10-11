# Roadmap Estratégico do Produto — Barbosa System

> **Aviso de Confidencialidade**: Documentação interna — não expor a clientes/usuários.

Este documento consolida o histórico de entregas do Barbosa System (versões v0.0.1 a v0.0.34), elenca as pendências e débitos técnicos conhecidos e organiza as propostas para os próximos ciclos de desenvolvimento.

---

## 1. Histórico de Entregas Realizadas (v0.0.1 a v0.0.34)

| Versão                | Período / Marco                   | Principais Funcionalidades Entregues                                                                                                                                                          | Status    |
| :-------------------- | :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **v0.0.1 – v0.0.4**   | Ciclo Inicial                     | Configuração do backend PocketBase (Skip Cloud), schema relacional inicial (`tasks`, `lists`), autenticação de usuários, isolamento multiusuário com RLS e base da interface Dark First.      | Concluído |
| **v0.0.5 – v0.0.7**   | Captura & Visões                  | Barra de captura rápida em linguagem natural (datas relativas em pt-BR), visões estruturadas _Inbox_, _Hoje_ e _Amanhã_, e cálculo de tempo estimado.                                         | Concluído |
| **v0.0.8**            | Pomodoro TickTick Etapa 1         | Página `/pomodoro`, coleção `focus_presets` com presets customizáveis, ciclo visual `BLOCO n/N`, e sons via Web Audio API para início/fim de foco e descanso.                                 | Concluído |
| **v0.0.9**            | Pomodoro TickTick Etapa 2         | Campo `note` na coleção `sessions`, prompt não-bloqueante _"O que foi feito?"_ durante o descanso, e linha do tempo de sessões na tela de foco e detalhes da tarefa.                          | Concluído |
| **v0.0.10**           | Arrastar e Soltar (Dnd)           | Campo `order` em `tasks` (Migration 0008) e reordenação com mouse e toque nas visões Hoje, Amanhã e Inbox com persistência em lote e sincronização em tempo real.                             | Concluído |
| **v0.0.11 – v0.0.15** | Etiquetas & Recorrência           | Coleção `tags`, cores temáticas, parser sintático de repetição (`daily`, `weekly`, `monthly`), preservação de tarefas concluídas e geração automática da próxima instância.                   | Concluído |
| **v0.0.16 – v0.0.18** | Horários & Sub-tarefas            | Campo `due_time` nas tarefas, ordenação temporal e notificações in-app para tarefas com hora marcada; suporte a sub-tarefas atômicas em JSON (`subtasks`) com barra de progresso.             | Concluído |
| **v0.0.19 – v0.0.21** | Agrupamento Dinâmico              | Visualização de Hoje e Amanhã agrupadas opcionalmente por etiqueta (`@tag`) ou por lista (`#lista`) com seções expansíveis e contadores.                                                      | Concluído |
| **v0.0.22**           | Módulo "Melhor Dia"               | Módulo `best-day.ts`: cálculo do recorde histórico absoluto de foco, melhor dia dos 14 dias civis e benchmark comparativo por dia da semana (média e recorde).                                | Concluído |
| **v0.0.23**           | Sidebar 80/20 Etapa 1             | Campos `order` e `pinned` nas coleções `tags` e `lists` (Migration 0016), reordenação manual na barra lateral e pinagem de itens de alto impacto.                                             | Concluído |
| **v0.0.24**           | Big3 Etapa 2                      | Cartão **BIG3** no topo de Hoje com as até 3 tarefas dos 80%, badges discretas com cores da fonte prioritária nos cards e selo de celebração **BIG3 COMPLETO**.                               | Concluído |
| **v0.0.25 – v0.0.27** | Hub de Perfil & MCP Etapa 1       | Perfil do usuário como hub central de configurações (metas diárias/semanais, preferências de som), e criação do servidor MCP nativo (`/backend/v1/mcp`) com ferramentas de leitura e criação. | Concluído |
| **v0.0.28**           | Navegação Mobile                  | Barra inferior ergonômica fixa (Hoje, Amanhã, Semana, Pomodoro, Histórico), drawer retrátil para etiquetas/listas/inbox e botão de captura rápida FAB flutuante.                              | Concluído |
| **v0.0.29 – v0.0.31** | MCP Etapa 2                       | Expansão para 10 ferramentas no MCP (parser no servidor, sub-tarefas, gestão de tags e listas 80/20, sessions) e autenticação via hash SHA-256 (`mcp_tokens`).                                | Concluído |
| **v0.0.32 – v0.0.33** | Ajustes de Responsividade         | Correções em modais, visão de Semana em telas compactas e robustez no arrastar-e-soltar em dispositivos móveis.                                                                               | Concluído |
| **v0.0.34**           | Divisão da Documentação (Etapa 1) | Hub de documentação `/docs` com roteamento separado para o Guia do Usuário (`/guia`) e Documentação Técnica de Desenvolvedor e MCP (`/dev`).                                                  | Concluído |
| **v0.0.35** _(atual)_ | Documentação Privada Corporativa  | Implementação da base de conhecimento restrita da empresa no repositório GitHub (`docs/privado/`: arquitetura, regras de negócio, ADRs, 80/20 e roadmap).                                     | Concluído |

---

## 2. Itens Pendentes e Débitos Conhecidos

Os itens a seguir foram catalogados a partir de decisões deliberadas e demandas identificadas:

### 2.1. Controle de Acesso e Cadastro por Convite

- **Status**: Pendente
- **Descrição**: O registro de novos usuários (`users`) atualmente está aberto para testes. É necessário restringir a criação de contas por meio de tokens de convite exclusivos gerados pela liderança ou fechamento do endpoint público.
- **Impacto**: Segurança e governança do produto em ambiente de produção restrito.

### 2.2. Compartilhamento de Listas entre Usuários

- **Status**: Proposto / Análise
- **Descrição**: Atualmente o isolamento por `user.id` é estrito (100% monousuário). Avaliar viabilidade de permissões de colaboração (_view/edit_) em listas compartilhadas sem quebrar as regras atuais de RLS do PocketBase.

### 2.3. Autenticação OAuth para Conectores Claude Web

- **Status**: Pendente (Evolução do MCP)
- **Descrição**: O servidor MCP nativo utiliza tokens pessoais (PAT) com hash SHA-256, funcionando perfeitamente em Claude Code, Claude Desktop e Gemini CLI. Conectores remotos na web (Claude Web) exigem fluxo OAuth 2.0 completo com redirection URI e token refresh.
- **Impacto**: Expansão da interoperabilidade de IA para usuários que não usam clientes locais.

### 2.4. Relatório Semanal Automatizado de Foco

- **Status**: Proposto
- **Descrição**: Criação de um resumo executivo semanal disparado por hook cron no PocketBase, consolidando horas de foco, cumprimento das metas por dia e taxa de sucesso do Big3.

### 2.5. Alternador Granular de Sons nas Configurações

- **Status**: Pendente
- **Descrição**: Possibilidade de ligar/desligar seletivamente sons de início de bloco, fim de foco, fim de pausa e lembretes de tarefas na tela de Configurações do perfil.

---

## 3. Próximos Ciclos Estratégicos

### Ciclo Q1 / Q2 — Estabilidade, Governança & Polish

1. Fechamento de cadastro e política de convites.
2. Refinamento de testes unitários ponta a ponta para regras de recorrência complexas e modo de excesso do Pomodoro.
3. Avaliação de desempenho do banco de dados PocketBase sob acúmulo de dezenas de milhares de sessões históricas.

### Ciclo Q3 / Q4 — Ecossistema & Inteligência Ativa

1. Conector MCP OAuth para ferramentas web de IA.
2. Agente pró-ativo de planejamento semanal baseado nos benchmarks de produtividade histórica do usuário.
3. Exportação de dados e relatórios em PDF/CSV para prestação de contas executiva.

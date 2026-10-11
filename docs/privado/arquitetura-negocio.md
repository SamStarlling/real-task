# Arquitetura de Negócio — Barbosa System

> **Aviso de Confidencialidade**: Documentação interna — não expor a clientes/usuários.

Este documento detalha o desenho conceitual, a proposta de valor, os fluxos centrais e a modelagem estrutural do **Barbosa System**, servindo como referência para liderança executiva, gerência de produto e desenvolvedores.

---

## 1. Visão do Produto

O **Barbosa System** é uma plataforma focada em produtividade pessoal de alta performance e execução intencional. Diferente de gerenciadores de tarefas genéricos que se tornam listas infinitas e passivas de pendências, o sistema foi concebido para resolver quatro gargalos fundamentais do trabalho moderno:

1. **Atrito de Entrada**: A captura de tarefas deve ser instantânea, interpretando datas, horários, etiquetas e listas diretamente em linguagem natural corrente sem necessidade de preencher formulários com múltiplos cliques.
2. **Paralisia por Sobrecarga (80/20 & Big3)**: O usuário não deve lidar com dezenas de tarefas ao mesmo tempo. O sistema aplica ativamente o princípio de Pareto, destacando no máximo as 3 tarefas mais impactantes do dia no cartão BIG3.
3. **Falta de Foco Real na Execução**: O agendamento é inútil sem execução focada. O sistema integra um temporizador Pomodoro diretamente atrelado a tarefas concretas, medindo o tempo real dedicado versus o tempo estimado.
4. **Fechamento de Ciclo e Feedback Contínuo**: Cada bloco de foco concluído registra o tempo real acumulado na tarefa, coleta um sumário do que foi entregue e gera dados para comparação com recordes históricos de produtividade pessoal.

---

## 2. A Cadeia de Valor das Funcionalidades

O valor gerado ao usuário pelo Barbosa System se estrutura em camadas sinérgicas:

```
[Captura Rápida NL]
        │
        ▼
[Visões Temporais & Organização] ──► (Inbox / Hoje / Amanhã / Semana / Listas)
        │
        ▼
[Filtro de Alto Impacto (Big3 / 80-20)]
        │
        ▼
[Execução Focada (Pomodoro)] ──► (Ciclos / Excesso / Sons / Notas)
        │
        ▼
[Métricas, Histórico & Benchmarks] ──► (Tempo Real / Melhor Dia / Metas)
```

1. **Captura em Linguagem Natural**: Reduz o tempo de entrada de ~30 segundos por tarefa para menos de 3 segundos, mantendo a mente do usuário livre para a tarefa atual.
2. **Estruturação Temporal Inteligente**: A segregação visual entre _Inbox_ (ideias e pendências não triadas), _Hoje_ (compromisso imediato), _Amanhã_ (preparação prévia) e _Semana_ (distribuição equilibrada) elimina o ruído cognitivo.
3. **Mecanismo de Priorização 80/20**: A capacidade de fixar listas e etiquetas prioritárias converte objetivos estratégicos de longo prazo em escolhas automáticas para o dia.
4. **Temporizador de Foco Acoplado**: Evita que o usuário precise alternar entre apps distintos para cronometrar Pomodoros e consultar sua lista de tarefas. O foco alimenta o histórico da própria tarefa.
5. **Visibilidade Analítica & Fechamento**: Fornece retorno psicológico imediato (selo de recorde, benchmarks por dia da semana e progresso de metas diárias/semanais).

---

## 3. Fluxos Críticos do Sistema

O ciclo de vida operacional do usuário dentro do Barbosa System divide-se em quatro fases contínuas:

### 3.1. Fluxo de Captura (Inflow)

- O usuário aciona o campo de captura (na barra superior no desktop ou no botão flutuante FAB no mobile).
- O usuário digita comandos naturais, por exemplo:
  `Apresentação executiva amanhã 15:30 #diretoria @urgente repete:semanal ~45m`
- O analisador sintático (parser cliente ou servidor MCP) extrai:
  - Título limpo: `Apresentação executiva`
  - Data de vencimento: data correspondente ao próximo dia
  - Horário de vencimento: `15:30`
  - Lista: `#diretoria` (cria ou associa à lista existente)
  - Etiquetas: `@urgente` (com paleta de cor atribuída)
  - Recorrência: semanal a cada 1 semana
  - Estimativa de esforço: 45 minutos
- A tarefa é salva atomicamente e já fica visível na visão correta via reatividade local e WebSocket do backend.

### 3.2. Fluxo de Organização e Triagem (Triage)

- Itens criados sem data caem na _Inbox_.
- Na Inbox, o usuário pode definir datas, atribuir sub-tarefas (checklist) ou simplesmente arrastar tarefas para reorganizar a ordem de execução.
- Na visão _Hoje_, as tarefas prioritárias (pertencentes a listas ou etiquetas fixadas com `pinned=true`) são ordenadas e preenchem as até 3 vagas do cartão **BIG3**.
- Tarefas do dia podem ser agrupadas visualmente por etiqueta, por lista ou mantidas na lista contínua com suporte a reordenação manual (drag-and-drop).

### 3.3. Fluxo de Foco e Execução (Execution)

- O usuário clica no ícone de foco de uma tarefa específica ou inicia o Pomodoro livre pelo atalho global.
- O timer inicia uma contagem regressiva baseada no preset ativo (padrão de fábrica: 25 min foco, 5 min pausa curta, 15 min pausa longa após 4 blocos).
- Ao zerar o tempo previsto, o sistema:
  - Dispara som característico via Web Audio API.
  - Envia notificação nativa no sistema operacional se a aba estiver em segundo plano.
  - **Não força transição para descanso**: entra em modo de excesso (_overtime_), permitindo que o usuário finalize o raciocínio sem interrupção brusca.
- O usuário clica manualmente em "Iniciar Pausa". O tempo total real (previsto + excesso) é registrado na coleção `sessions` e somado a `actual_minutes` na tarefa.
- Durante a pausa, um diálogo não-bloqueante indaga: _"O que foi feito nesse bloco?"_, permitindo documentar a entrega na sessão sem quebrar o fluxo.

### 3.4. Fluxo de Revisão e Progresso (Review)

- Ao concluir a tarefa (`toggleTaskDone`), o sistema:
  - Marca `done = true` e preenche `completed_at`.
  - Se a tarefa possuir regra de recorrência, instancia automaticamente a próxima ocorrência no banco, herdando checklist resetado, lista, tags, prioridade e horário.
- A página _Histórico_ consolida todo o tempo de foco por dia, exibe a timeline com as notas registradas e compara o desempenho atual com:
  - Recorde absoluto de minutos de foco da conta.
  - Melhor dia dentro dos últimos 14 dias.
  - Média e recorde históricos para aquele dia específico da semana (ex: _"Suas terças: Média 1h 40m · Recorde 2h 30m"_).
  - Progresso frente às metas diárias e metas personalizadas por dia da semana configuradas no perfil.

---

## 4. Modelo de Dados em Alto Nível

A persistência do sistema é estruturada sobre o PocketBase (Skip Cloud), utilizando SQLite com tipos estritos e regras de controle de acesso baseadas em linha (Row-Level Security).

```
 ┌──────────────┐
 │    users     │
 └──────┬───────┘
        │ 1:N
        ├─────────────────────────────────────────────────┐
        │ 1:N                                             │ 1:N
        ▼                                                 ▼
 ┌──────────────┐                                  ┌──────────────┐
 │    lists     │                                  │     tags     │
 └──────┬───────┘                                  └──────┬───────┘
        │ 1:N                                             │ N:M
        ▼                                                 ▼
 ┌────────────────────────────────────────────────────────┐
 │                         tasks                          │
 │  - title, due_date, due_time, priority                 │
 │  - estimated_minutes, actual_minutes                   │
 │  - recurrence_type, interval, weekdays, mode           │
 │  - subtasks (JSON)                                     │
 └────────────────────────────┬───────────────────────────┘
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │   sessions   │
                       │  - duration  │
                       │  - note      │
                       │  - status    │
                       └──────────────┘
```

### 4.1. Entidades Principais

- **`users` (Coleção Auth)**:
  Armazena identidade, e-mail, nome, avatar, meta diária global de foco (`daily_focus_goal_minutes`), matriz de metas semanais (`weekly_focus_goals` em JSON por dia da semana) e preferências de notificações sonoras e de antecedência (`notification_preferences` em JSON).
- **`lists`**:
  Pastas temáticas de tarefas (ex: Trabalho, Pessoal, Diretoria). Possui ordenação manual (`order`) e suporte a pinagem prioritária (`pinned`).
- **`tags`**:
  Etiquetas transversais com identificação cromática (`color`), ordenação manual (`order`) e pinagem para o princípio 80/20 (`pinned`).
- **`tasks`**:
  Entidade central de trabalho. Relacionada com um único usuário, opcionalmente com uma lista e múltiplas tags. Armazena previsões de tempo, tempo real acumulado, regras de repetição e sub-tarefas atômicas em JSON.
- **`sessions`**:
  Registros imutáveis de cada bloco de foco concluído ou interrompido. Vinculada obrigatoriamente a um usuário e opcionalmente a uma tarefa. Armazena data, horários de início e fim, duração em minutos, status e nota qualitativa de entrega (`note`).
- **`focus_presets`**:
  Perfis customizados de Pomodoro (nome, minutos de foco, minutos de pausa curta, minutos de pausa longa e quantidade de blocos antes da pausa longa).
- **`mcp_tokens`**:
  Credenciais de integração para assistentes de inteligência artificial via protocolo MCP. Guarda o hash SHA-256 do token gerado, status de revogação e último uso.

### 4.2. Isolamento Multiusuário e Segurança

O sistema opera com isolamento absoluto por inquilino (_tenant_ por usuário):

- Toda query no backend avalia `@request.auth.id != '' && user.id = @request.auth.id`.
- Nenhuma rota ou tela permite leitura, alteração ou exclusão de registros pertencentes a outro `user.id`.
- Na exclusão de conta, a política de integridade remove em cascata ou desativa o acesso aos dados subordinados do usuário.
- O isolamento é testado tanto na camada de API REST quanto nas chamadas nativas de ferramentas MCP.

# Regras de Negócio Consolidadas — Barbosa System

> **Aviso de Confidencialidade**: Documentação interna — não expor a clientes/usuários.

Este documento consolida as regras de negócio vigentes no código-fonte do Barbosa System, especificando o comportamento exato das rotinas de cálculo, persistência e interface do usuário.

---

## 1. Regras de Recorrência de Tarefas

A recorrência no Barbosa System foi modelada para garantir que o histórico de conclusões nunca seja sobrescrito. Ao concluir uma tarefa recorrente, a instância atual permanece registrada no histórico como concluída e uma nova instância independente é instanciada no banco (`toggleTaskDone` em `src/services/data.ts`).

### 1.1. Tipos e Modos de Recorrência

- **Tipos (`recurrence_type`)**:
  - `none`: Sem repetição.
  - `daily`: Diária a cada $N$ dias (`recurrence_interval`).
  - `weekly`: Semanal a cada $N$ semanas (`recurrence_interval * 7` dias).
  - `weekly_days`: Semanal em dias específicos da semana (`recurrence_weekdays`, onde 0=domingo, 1=segunda... 6=sábado).
  - `monthly`: Mensal no mesmo dia do mês a cada $N$ meses, com ajuste automático de teto (_clamp_) para o último dia válido em meses com menos dias (ex: 31 de janeiro → 28 de fevereiro).
- **Modos de Cálculo (`recurrence_mode`)**:
  - `from_date` (padrão): A próxima data é projetada a partir da data de vencimento prevista (`due_date`) da tarefa original.
  - `from_completion`: A próxima data é projetada a partir do momento real em que o usuário marcou a tarefa como concluída (`completionDate`).

### 1.2. Herança na Próxima Instância

Ao disparar a criação automática da próxima instância de uma tarefa com `recurrence_type !== 'none'`:

1. **Título (`title`)**: Herdado integralmente.
2. **Proprietário (`user`)**: Herdado integralmente.
3. **Lista (`list`)**: Herdada integralmente.
4. **Etiquetas (`tags`)**: Herdadas integralmente.
5. **Prioridade (`priority`)**: Herdada integralmente (P1 a P4 ou 0).
6. **Horário previsto (`due_time`)**: Herdado integralmente no formato `"HH:MM"`.
7. **Estimativa (`estimated_minutes`)**: Herdada integralmente.
8. **Tempo realizado (`actual_minutes`)**: **Resetado para 0** (o esforço acumulado pertence à instância concluída).
9. **Status (`done`)**: **Definido como false**.
10. **Ordem de exibição (`order`)**: Incrementado como `(task.order || 0) + 1`.
11. **Sub-tarefas (`subtasks`)**:
    - A lista de sub-tarefas é clonada mantendo títulos, IDs e sequência original.
    - **Todas as sub-tarefas têm o status `done` resetado para `false`** via `resetSubtasksForRecurrence`.
12. **Regra de recorrência**: Mantida idêntica na nova tarefa para garantir a continuidade dos ciclos subsequentes.

---

## 2. Regras do Pomodoro e Gestão de Tempo

O temporizador Pomodoro (`src/contexts/PomodoroContext.tsx`) segue princípios estritos de ergonomia cognitiva e não-interrupção involuntária do usuário.

### 2.1. Fases e Ciclos

- **Fases (`PomodoroPhase`)**:
  - `foco`: Bloco de trabalho dedicado.
  - `descanso_curto`: Pausa breve entre blocos ordinários.
  - `descanso_longo`: Pausa estendida após completar o número estipulado de blocos.
- **Ciclo de Blocos**:
  - Cada preset define `blocks_before_long_break` (mínimo de 1 bloco; padrão: 4).
  - O bloco atual é numerado de 1 até $N$ (`BLOCO 1/4`, `BLOCO 2/4`...).
  - Quando o bloco atual alcança ou supera o total, a próxima pausa sugerida é automaticamente `descanso_longo`.
  - Ao concluir a pausa longa, o ciclo reinicia no Bloco 1.

### 2.2. Presets de Foco (`focus_presets`)

- Todo usuário possui parâmetros configuráveis validados por restrições no banco (Migration 0012):
  - `work_minutes` (tempo de foco): Mínimo obrigatório de 5 minutos (padrão: 25).
  - `short_break_minutes` (pausa curta): Mínimo obrigatório de 5 minutos (padrão: 5).
  - `long_break_minutes` (pausa longa): Mínimo obrigatório de 5 minutos (padrão: 15).
  - `blocks_before_long_break`: Mínimo obrigatório de 1 bloco (padrão: 4).
  - Presets podem ser arquivados (`archived = true`) em vez de deletados para preservar integridade relacional.

### 2.3. Não-Interrupção e Modo de Excesso (_Overtime_)

- **Regra Crítica**: O sistema **NUNCA** força a troca de fase automaticamente nem encerra um bloco de foco à revelia do usuário.
- Ao atingir `00:00`:
  1. Toca o som de alerta correspondente via Web Audio API (`playFocusCompleteSound` ou `playBreakCompleteSound`).
  2. Dispara notificação nativa do sistema caso a aba do navegador esteja em segundo plano (`document.hidden`).
  3. O timer **continua rodando em modo de excesso** (`isOvertime = true`), incrementando `overtimeSeconds` com destaque visual característico.
- A transição exige ação intencional do usuário:
  - Botão _"Iniciar Pausa"_ (durante foco em excesso).
  - Botão _"Iniciar Próximo Bloco"_ (durante descanso em excesso).

### 2.4. Registro de Sessões e Nota de Fechamento

- **Persistência de Sessão**:
  - Apenas blocos de `foco` geram registros na coleção `sessions`. Descansos não poluem o banco.
  - Se o foco for concluído normalmente ou em excesso: `status = 'completa'`.
  - Se for descartado ou interrompido manualmente antes de completar o tempo: `status = 'interrompida'`.
  - O tempo total gravado na sessão e somado em `task.actual_minutes` engloba **o tempo previsto mais todo o tempo em excesso trabalhado**.
- **Prompt Não-Bloqueante pós-foco**:
  - Imediatamente após clicar em _"Iniciar Pausa"_, o sistema abre um campo discreto: _"O que foi feito nesse bloco?"_.
  - A nota é opcional, limitada a 500 caracteres, salva na sessão recém-criada via `updateSessionNote` e exibida nas timelines de histórico e detalhes da tarefa.
  - A pergunta não pausa nem atrasa o início do descanso.

---

## 3. Regras do Big3 e Metodologia 80/20

O mecanismo do Big3 (`src/services/data.ts` e `src/pages/Index.tsx`) operacionaliza o princípio de que poucas tarefas produzem a quase totalidade do resultado prático do dia.

### 3.1. Definição da Origem Prioritária (Fontes dos 80%)

- Uma tarefa é considerada candidata ao Big3 se estiver vinculada a pelo menos uma:
  - **Lista prioritária**: lista com campo `pinned === true`.
  - **Etiqueta prioritária**: etiqueta com campo `pinned === true`.
- Caso a tarefa pertença a múltiplas listas ou etiquetas prioritárias, a função `getTaskBig3Source` seleciona a fonte de maior hierarquia, avaliando o menor valor do campo `order` (posicionamento no topo da sidebar) e critério alfabético de desempate.

### 3.2. Algoritmo de Seleção e Ordenação do Big3

O cartão Big3 no topo da visão Hoje (`selectBig3ForDay`) processa as tarefas conforme as etapas:

1. **Filtro Temporal**: Inclui tarefas com data de vencimento menor ou igual a hoje (`due_date <= hoje`), abrangendo pendências atrasadas que exigem resolução prioritária.
2. **Filtro de Origem**: Mantém apenas itens que possuem origem prioritária válida.
3. **Precedência de Status**: Tarefas pendentes (`done === false`) têm precedência sobre tarefas já concluídas para manter o foco na ação imediata.
4. **Ordenação Fina (`compareBig3Tasks`)**:
   - 1º: Ordem da lista/etiqueta mãe (menor `order` primeiro).
   - 2º: Nível de prioridade P1 a P4 da tarefa (P1=1 até P4=4; tarefas sem prioridade tratadas como 99).
   - 3º: Tarefas com horário (`due_time`) antes de tarefas sem horário; entre elas, ordenação cronológica ascendente (`"09:00"` antes de `"14:00"`).
   - 4º: Posição manual de arrasto da tarefa (`order` crescente).
   - 5º: Momento de criação (`-created`).
5. **Limite de Capacidade**: O cartão seleciona estritamente até as **3 primeiras tarefas** (`top3`). Se houver mais de 3 tarefas candidatas, exibe o rodapé informativo: `+N tarefas prioritárias na lista de hoje`.

### 3.3. Selo "BIG3 COMPLETO"

- Quando todas as tarefas presentes no cartão Big3 (de 1 a 3 itens) são marcadas como concluídas, o cartão assume estilo visual de sucesso e exibe o selo **BIG3 COMPLETO**.

---

## 4. Regras de Recordes e "Melhor Dia"

O módulo de métricas analíticas (`src/lib/best-day.ts`) consolida o tempo de foco diário a partir da agregação de todas as sessões registradas por data (`session_date`):

### 4.1. Recorde Absoluto

- Avalia todas as datas históricas com foco registrado do usuário.
- Identifica a data com o maior somatório de minutos de foco.
- Se o dia de hoje atingir ou superar essa marca (com pelo menos 1 minuto de foco), a bandeira `isTodayRecord` é ativada e o selo de destaque **NOVO RECORDE** é renderizado.
- Caso contrário, o sistema calcula exatamente quanto falta para bater o recorde (`minutesRemainingToBeat = bestDay.totalMinutes - todayMinutes`).

### 4.2. Melhor Dia dos Últimos 14 Dias

- Filtra a janela móvel estrita dos últimos 14 dias civis contados a partir da data de referência.
- Identifica o dia com maior volume de foco no período e destaca a barra correspondente no gráfico de distribuição temporal.

### 4.3. Benchmark por Dia da Semana

- Agrupa todas as sessões registradas pelo índice do dia da semana (domingo a sábado).
- Calcula:
  - Média histórica de minutos de foco para aquele dia da semana (`averageMinutes`).
  - Recorde histórico atingido naquele dia da semana (`recordMinutes`).
  - Total de dias considerados na amostra (`totalDaysCount`).
- Exibe o benchmark contextualizado para o usuário (ex: _"Suas segundas: Média 1h 40m · Recorde 2h 30m"_), permitindo calibrar a carga de trabalho de acordo com o padrão real de cada dia.

---

## 5. Regras de Metas Diárias e Semanais

- **Meta Diária Global**: Configurada em minutos (`daily_focus_goal_minutes`) no registro do usuário. Serve como parâmetro padrão de barra de progresso diária.
- **Metas Semanais por Dia da Semana**:
  - Armazenadas no campo JSON `weekly_focus_goals` com chaves estritas: `seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`.
  - Permitem estabelecer metas diferenciadas para dias úteis (ex: 4 horas) e fins de semana (ex: 0 ou 1 hora).
  - Padrão de fábrica: 120 minutos para dias úteis (seg–sex) e 0 minutos para sábado e domingo.

---

## 6. Regras de Sub-tarefas (Checklist)

O recurso de sub-tarefas (`src/types.ts` e `src/components/TaskDetail.tsx`) é estruturado como um campo JSON nativo no registro da própria tarefa:

1. **Independência de Status**:
   - Concluir a tarefa principal **NÃO** marca automaticamente suas sub-tarefas como concluídas.
   - Concluir todas as sub-tarefas **NÃO** marca automaticamente a tarefa principal como concluída (o usuário pode manter a tarefa aberta para revisão final).
2. **Cálculo de Progresso**:
   - Indicador visual fracionário `completed / total` e percentual de barra.
   - Quando `completed === total` e `total > 0`, a tag de sub-tarefas ganha estado de destaque completo.
3. **Manipulação Atômica**:
   - Adicionar, renomear, alternar check, excluir ou reordenar sub-tarefas atualiza o array completo no campo `subtasks` da tarefa em uma única transação atômica.
4. **Comportamento em Recorrência**:
   - Conforme especificado na Seção 1.2, todas as sub-tarefas são transferidas para a nova ocorrência com seus títulos e posições preservadas, porém com `done = false`.

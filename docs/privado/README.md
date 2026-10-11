# Documentação Interna & Privada — Barbosa System

> **Aviso de Confidencialidade**: Documentação interna — não expor a clientes/usuários.
> Este material é de uso restrito da equipe de produto, engenharia e liderança do Barbosa System.

Bem-vindo à base de conhecimento corporativa e estratégica do Barbosa System. Esta documentação reside exclusivamente no repositório de código privado da empresa para garantir controle de acesso por meio de credenciais de versionamento, sem onerar o aplicativo em produção com rotas protegidas ou mecanismos complexos de autenticação interna.

---

## Índice de Documentos

1. [Arquitetura de Negócio](arquitetura-negocio.md)
   - Visão do produto e posicionamento de mercado
   - O núcleo de produtividade pessoal de alta performance
   - Cadeia de valor das funcionalidades
   - Fluxos críticos do sistema (Captura → Organização → Foco → Revisão)
   - Modelo de dados em alto nível e isolamento multiusuário

2. [Regras de Negócio Consolidadas](regras-negocio.md)
   - Regras de recorrência e herança de atributos na próxima instância
   - Ciclos de Pomodoro, transições manuais, excesso e notas de fechamento
   - Algoritmo de prioridade Big3 e o princípio 80/20
   - Métricas de foco e recordes (melhor dia absoluto, 14 dias e benchmark semanal)
   - Metas diárias/semanais e isolamento do ciclo de vida de sub-tarefas

3. [Registro de Decisões de Arquitetura (ADRs)](adrs.md)
   - Histórico sequencial das decisões tecnológicas e de produto
   - Contexto de cada decisão, opções avaliadas, decisão formal e consequências operacionais
   - Decisões de backend (Skip Cloud/PocketBase), stack frontend, interface Dark First, tokens MCP e documentação corporativa

4. [Fundamentação Metodológica: O Princípio 80/20 & Big3](metodologia-80-20.md)
   - Justificativa conceitual e aplicação prática da Lei de Pareto no sistema
   - Como o produto guia o usuário a focar nos 20% de esforço que geram 80% do impacto
   - Implementação na interface: pinagem na sidebar, cartão BIG3 e indicadores
   - Critérios objetivos para priorização e rotina de validação semanal

5. [Roadmap Estratégico do Produto](roadmap.md)
   - Histórico consolidado das entregas (v0.0.1 a v0.0.34)
   - Itens pendentes e melhorias planejadas
   - Backlog aberto para os próximos ciclos de desenvolvimento e maturidade do produto

---

## Convenções Gerais

- **Linguagem**: Toda a documentação e interface oficial utilizam Português do Brasil (pt-BR).
- **Sem Dados Sensíveis**: Arquivos versionados não devem conter segredos de ambiente, chaves de API, senhas ou tokens ativos.
- **Padrão de Evolução**: Atualizações nas regras de código ou na estratégia de produto devem refletir imediatamente nestes documentos via pull requests revisados.

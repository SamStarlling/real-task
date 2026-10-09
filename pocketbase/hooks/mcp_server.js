// pocketbase/hooks/mcp_server.js
// Servidor MCP (Model Context Protocol) - Etapa 1
// Suporta JSON-RPC 2.0 via Streamable HTTP (POST e GET SSE) em /backend/v1/mcp
// e autenticação Bearer com tokens da coleção `mcp_tokens`.
// Nota de escopo JSVM: toda a lógica de handlers deve estar inline nos callbacks de routerAdd.

// Handler GET: suporte a SSE / streamable HTTP
routerAdd('GET', '/backend/v1/mcp', (e) => {
  // Configura cabeçalhos CORS
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  e.response
    .header()
    .set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID, Accept',
    )

  const authHeader = e.request.header.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return e.json(401, {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Autenticação necessária: forneça header Authorization: Bearer <token>',
      },
      id: null,
    })
  }

  const rawToken = authHeader.substring(7).trim()
  if (!rawToken) {
    return e.json(401, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token de autenticação vazio' },
      id: null,
    })
  }

  const tokenHash = $security.sha256(rawToken)
  let tokenRecord = null
  try {
    tokenRecord = $app.findFirstRecordByData('mcp_tokens', 'token_hash', tokenHash)
  } catch (_) {
    return e.json(401, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token MCP inválido ou não encontrado' },
      id: null,
    })
  }

  if (tokenRecord.getBool('revoked')) {
    return e.json(403, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token MCP revogado' },
      id: null,
    })
  }

  // Atualizar last_used_at sem bloquear
  try {
    tokenRecord.set('last_used_at', new Date().toISOString())
    $app.save(tokenRecord)
  } catch (_) {}

  const acceptHeader = e.request.header.get('Accept') || ''
  const sessionId =
    e.request.header.get('Mcp-Session-Id') || 'session_' + $security.randomString(16)
  e.response.header().set('Mcp-Session-Id', sessionId)

  // Se o cliente solicitou text/event-stream, inicia o stream SSE de keep-alive
  if (acceptHeader.includes('text/event-stream')) {
    e.response.header().set('Content-Type', 'text/event-stream; charset=utf-8')
    e.response.header().set('Cache-Control', 'no-cache, no-transform')
    e.response.header().set('Connection', 'keep-alive')
    return e.string(200, ': keep-alive\n\n')
  }

  return e.json(200, {
    status: 'ok',
    transport: 'streamable-http',
    session_id: sessionId,
    server: 'barbosa-system-mcp/1.0',
  })
})

// Handler OPTIONS para preflight CORS
routerAdd('OPTIONS', '/backend/v1/mcp', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  e.response
    .header()
    .set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID, Accept',
    )
  return e.noContent(204)
})

// Handler POST: processamento de mensagens JSON-RPC 2.0
routerAdd('POST', '/backend/v1/mcp', (e) => {
  // CORS headers
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  e.response
    .header()
    .set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID, Accept',
    )

  // Autenticação Bearer
  const authHeader = e.request.header.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return e.json(401, {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Autenticação necessária: forneça header Authorization: Bearer <token>',
      },
      id: null,
    })
  }

  const rawToken = authHeader.substring(7).trim()
  if (!rawToken) {
    return e.json(401, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token de autenticação vazio' },
      id: null,
    })
  }

  const tokenHash = $security.sha256(rawToken)
  let tokenRecord = null
  try {
    tokenRecord = $app.findFirstRecordByData('mcp_tokens', 'token_hash', tokenHash)
  } catch (_) {
    return e.json(401, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token MCP inválido ou não encontrado' },
      id: null,
    })
  }

  if (tokenRecord.getBool('revoked')) {
    return e.json(403, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token MCP revogado' },
      id: null,
    })
  }

  const userId = tokenRecord.getString('user')
  if (!userId) {
    return e.json(403, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Token não está associado a nenhum usuário válido' },
      id: null,
    })
  }

  // Atualizar last_used_at sem quebrar a requisição se falhar
  try {
    tokenRecord.set('last_used_at', new Date().toISOString())
    $app.save(tokenRecord)
  } catch (_) {}

  // Tratar Mcp-Session-Id: ecoar ou gerar novo
  let sessionId = e.request.header.get('Mcp-Session-Id')
  if (!sessionId) {
    sessionId = 'bs_sess_' + $security.randomString(20)
  }
  e.response.header().set('Mcp-Session-Id', sessionId)

  // Ler e fazer parse do body
  let rawBody = ''
  try {
    rawBody = toString(e.request.body)
  } catch (readErr) {
    return e.json(400, {
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error: não foi possível ler o corpo da requisição' },
      id: null,
    })
  }

  if (!rawBody || rawBody.trim().length === 0) {
    return e.json(400, {
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error: corpo vazio' },
      id: null,
    })
  }

  let rpcMessage = null
  try {
    rpcMessage = JSON.parse(rawBody)
  } catch (parseErr) {
    return e.json(400, {
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error: JSON inválido (' + parseErr.message + ')' },
      id: null,
    })
  }

  // Suporte a mensagens únicas (JSON-RPC)
  // Notificações JSON-RPC não possuem `id` (ou id é undefined/ausente)
  const isNotification = rpcMessage.id === undefined || rpcMessage.id === null
  const msgId = rpcMessage.id !== undefined ? rpcMessage.id : null
  const method = String(rpcMessage.method || '')
  const params = rpcMessage.params || {}

  // Helper local de resposta de erro JSON-RPC
  const makeError = (code, message, data) => {
    const errObj = { code: code, message: message }
    if (data !== undefined) errObj.data = data
    return {
      jsonrpc: '2.0',
      error: errObj,
      id: msgId,
    }
  }

  // Helper local de resposta de sucesso JSON-RPC
  const makeSuccess = (result) => {
    return {
      jsonrpc: '2.0',
      result: result,
      id: msgId,
    }
  }

  // Helper de paleta de cores para tags criadas via MCP
  const TAG_COLORS = [
    '#C5A880', // Ouro Champagne
    '#8F9E82', // Verde-Oliva
    '#7E92A2', // Azul-Ardósia
    '#B37D6B', // Terracota
    '#876B7B', // Vinho / Ameixa
    '#6B878A', // Cinza-Azulado
    '#9E926B', // Ocre Fosco
    '#6B7A9E', // Índigo Acinzentado
  ]

  // Formatação de data em "YYYY-MM-DD" local
  const formatIsoDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + day
  }

  // 1. Método: notifications/initialized
  if (method === 'notifications/initialized') {
    return e.noContent(202)
  }

  // 2. Método: ping
  if (method === 'ping') {
    if (isNotification) return e.noContent(202)
    return e.json(200, makeSuccess({}))
  }

  // 3. Método: initialize
  if (method === 'initialize') {
    const initResult = {
      protocolVersion: '2025-03-26',
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: 'barbosa-system-mcp',
        version: '1.0.0',
      },
      instructions:
        'Servidor MCP do Barbosa System (produtividade pessoal, tarefas e foco Pomodoro). Todas as operações são executadas no escopo do usuário autenticado.',
    }
    if (isNotification) return e.noContent(202)
    return e.json(200, makeSuccess(initResult))
  }

  // 4. Método: tools/list
  if (method === 'tools/list') {
    const tools = [
      {
        name: 'create_task',
        description:
          'Cria uma nova tarefa no Barbosa System para o usuário autenticado. Permite definir título, data de vencimento (YYYY-MM-DD), horário (HH:MM), prioridade (1=P1 urgente, 2=P2 alta, 3=P3 média, 4=P4 baixa), estimativa de minutos, lista (nome) e tags (nomes).',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Título da tarefa (obrigatório).',
            },
            due_date: {
              type: 'string',
              description: 'Data de vencimento no formato YYYY-MM-DD (ex: "2025-04-15"). Opcional.',
            },
            due_time: {
              type: 'string',
              description:
                'Horário de vencimento no formato HH:MM (ex: "14:30" ou "09:00"). Opcional.',
            },
            priority: {
              type: 'integer',
              enum: [1, 2, 3, 4],
              description:
                'Prioridade da tarefa: 1=P1 (Urgente), 2=P2 (Alta), 3=P3 (Média), 4=P4 (Baixa). Opcional.',
            },
            estimated_minutes: {
              type: 'integer',
              minimum: 5,
              maximum: 240,
              description:
                'Tempo estimado de foco em minutos (mínimo 5, padrão 25, máximo 240). Opcional.',
            },
            list: {
              type: 'string',
              description:
                'Nome da lista/projeto onde a tarefa será alocada (ex: "Trabalho", "Pessoal"). Se a lista não existir, será criada automaticamente. Opcional.',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Lista de nomes de etiquetas/tags (ex: ["urgente", "revisão"]). As etiquetas inexistentes serão criadas automaticamente. Opcional.',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'list_tasks',
        description:
          'Lista tarefas do Barbosa System com múltiplos filtros opcionais: por data específica, visão temporal ("hoje", "amanhã", "inbox", "semana"), status concluído, nome da lista, nome da tag ou limite.',
        inputSchema: {
          type: 'object',
          properties: {
            view: {
              type: 'string',
              enum: ['hoje', 'amanhã', 'inbox', 'semana'],
              description:
                'Visão temporal filtrada: "hoje" (vencem hoje ou atrasadas), "amanhã", "inbox" (sem data) ou "semana" (próximos 7 dias).',
            },
            date: {
              type: 'string',
              description: 'Data específica de vencimento no formato YYYY-MM-DD.',
            },
            tag: {
              type: 'string',
              description: 'Filtrar por nome de etiqueta/tag.',
            },
            list: {
              type: 'string',
              description: 'Filtrar por nome de lista/projeto.',
            },
            done: {
              type: 'boolean',
              description:
                'Filtrar por tarefas concluídas (true) ou pendentes (false). Padrão: false (apenas pendentes).',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Número máximo de tarefas a retornar (padrão: 50).',
            },
          },
        },
      },
      {
        name: 'complete_task',
        description:
          'Marca uma tarefa como concluída (done=true). Se a tarefa possuir regra de recorrência ativa, cria automaticamente a próxima ocorrência preservando a regra, sub-tarefas e histórico.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID da tarefa a ser concluída (obrigatório).',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'update_task',
        description:
          'Atualiza campos de uma tarefa existente: título, data, horário, prioridade, estimativa, lista ou tags.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID da tarefa a ser atualizada (obrigatório).',
            },
            title: {
              type: 'string',
              description: 'Novo título da tarefa.',
            },
            due_date: {
              type: 'string',
              description:
                'Nova data de vencimento (YYYY-MM-DD) ou string vazia para mover ao Inbox.',
            },
            due_time: {
              type: 'string',
              description: 'Novo horário de vencimento (HH:MM) ou string vazia para remover.',
            },
            priority: {
              type: 'integer',
              enum: [0, 1, 2, 3, 4],
              description: 'Nova prioridade: 1=P1, 2=P2, 3=P3, 4=P4 ou 0 para sem prioridade.',
            },
            estimated_minutes: {
              type: 'integer',
              minimum: 5,
              maximum: 240,
              description: 'Novo tempo estimado em minutos.',
            },
            list: {
              type: 'string',
              description:
                'Nome da nova lista (resolvida ou criada automaticamente) ou "" para desvincular.',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista completa de nomes de tags a associar à tarefa.',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_task',
        description: 'Remove definitivamente uma tarefa do usuário pelo ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID da tarefa a ser excluída (obrigatório).',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_focus_summary',
        description:
          'Retorna o resumo métrico de foco do usuário: total de minutos focados, número de sessões concluídas e — no período "todos" — o recorde absoluto de foco (melhor dia histórico) alinhado ao módulo best-day.',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['hoje', 'semana', 'todos'],
              description:
                'Período de agregação do foco: "hoje" (padrão), "semana" (últimos 7 dias) ou "todos" (histórico integral com melhor dia e recorde absoluto).',
            },
          },
        },
      },
      {
        name: 'log_focus_session',
        description:
          'Registra manualmente uma sessão de foco concluída para o usuário. Permite associar a uma tarefa existente (atualizando seu tempo real) ou criar foco livre, com duração em minutos e nota opcional.',
        inputSchema: {
          type: 'object',
          properties: {
            duration_minutes: {
              type: 'integer',
              minimum: 1,
              description: 'Duração da sessão em minutos (obrigatório, maior que 0).',
            },
            task_id: {
              type: 'string',
              description:
                'ID da tarefa relacionada à sessão de foco. Se omitido, será uma sessão de foco livre.',
            },
            note: {
              type: 'string',
              maxLength: 500,
              description:
                'Nota descritiva do que foi executado durante a sessão (máx. 500 caracteres). Opcional.',
            },
          },
          required: ['duration_minutes'],
        },
      },
    ]

    if (isNotification) return e.noContent(202)
    return e.json(200, makeSuccess({ tools: tools }))
  }

  // 5. Método: tools/call
  if (method === 'tools/call') {
    const toolName = String(params.name || '')
    const args = params.arguments || {}

    // Resposta de erro da ferramenta (isError: true)
    const toolFail = (msg) => {
      const resp = {
        content: [{ type: 'text', text: 'Erro: ' + msg }],
        isError: true,
      }
      if (isNotification) return e.noContent(202)
      return e.json(200, makeSuccess(resp))
    }

    // Resposta de sucesso da ferramenta
    const toolOk = (obj, readableText) => {
      const text = readableText || JSON.stringify(obj, null, 2)
      const resp = {
        content: [{ type: 'text', text: text }],
        structuredContent: obj,
        isError: false,
      }
      if (isNotification) return e.noContent(202)
      return e.json(200, makeSuccess(resp))
    }

    // FERRAMENTA 1: create_task
    if (toolName === 'create_task') {
      const title = String(args.title || '').trim()
      if (!title) {
        return toolFail('O parâmetro "title" é obrigatório.')
      }

      // Resolver lista por nome se fornecido
      let listId = ''
      if (args.list && String(args.list).trim()) {
        const listName = String(args.list).trim()
        const filter = "user = '" + userId + "' && name = '" + listName.replace(/'/g, "\\'") + "'"
        const foundLists = $app.findRecordsByFilter('lists', filter, '', 1, 0)
        if (foundLists.length > 0) {
          listId = foundLists[0].id
        } else {
          // Cria nova lista
          const listsCol = $app.findCollectionByNameOrId('lists')
          const newList = new Record(listsCol)
          newList.set('name', listName)
          newList.set('user', userId)
          newList.set('order', 10)
          newList.set('pinned', false)
          $app.save(newList)
          listId = newList.id
        }
      }

      // Resolver tags por nome se fornecido
      let tagIds = []
      if (Array.isArray(args.tags) && args.tags.length > 0) {
        for (let i = 0; i < args.tags.length; i++) {
          const tName = String(args.tags[i] || '')
            .trim()
            .replace(/^@/, '')
          if (!tName) continue
          const tFilter = "user = '" + userId + "' && name = '" + tName.replace(/'/g, "\\'") + "'"
          const foundTags = $app.findRecordsByFilter('tags', tFilter, '', 1, 0)
          if (foundTags.length > 0) {
            tagIds.push(foundTags[0].id)
          } else {
            // Conta tags para pegar a próxima cor da paleta
            const userTagsCount = $app.countRecords('tags', "user = '" + userId + "'")
            const color = TAG_COLORS[userTagsCount % TAG_COLORS.length]
            const tagsCol = $app.findCollectionByNameOrId('tags')
            const newTag = new Record(tagsCol)
            newTag.set('name', tName)
            newTag.set('user', userId)
            newTag.set('color', color)
            newTag.set('order', (userTagsCount + 1) * 10)
            newTag.set('pinned', false)
            $app.save(newTag)
            tagIds.push(newTag.id)
          }
        }
      }

      const tasksCol = $app.findCollectionByNameOrId('tasks')
      const taskRecord = new Record(tasksCol)
      taskRecord.set('title', title)
      taskRecord.set('user', userId)
      if (listId) taskRecord.set('list', listId)
      if (tagIds.length > 0) taskRecord.set('tags', tagIds)

      if (args.due_date) {
        const dStr = String(args.due_date).trim()
        taskRecord.set('due_date', dStr.includes('T') ? dStr : dStr + ' 12:00:00.000Z')
      }
      if (args.due_time) {
        taskRecord.set('due_time', String(args.due_time).trim())
      }
      if (args.priority !== undefined && args.priority !== null) {
        const pNum = Number(args.priority)
        if (pNum >= 1 && pNum <= 4) taskRecord.set('priority', pNum)
      }
      const estMin = args.estimated_minutes
        ? Math.max(5, Math.min(240, Number(args.estimated_minutes)))
        : 25
      taskRecord.set('estimated_minutes', estMin)
      taskRecord.set('actual_minutes', 0)
      taskRecord.set('done', false)

      // Calcula próximo order
      const existingUserTasks = $app.findRecordsByFilter(
        'tasks',
        "user = '" + userId + "'",
        '-order',
        1,
        0,
      )
      const nextOrder =
        existingUserTasks.length > 0 ? (existingUserTasks[0].getInt('order') || 0) + 10 : 10
      taskRecord.set('order', nextOrder)

      $app.save(taskRecord)

      const resultPayload = {
        id: taskRecord.id,
        title: taskRecord.getString('title'),
        due_date: taskRecord.getString('due_date'),
        due_time: taskRecord.getString('due_time'),
        priority: taskRecord.getInt('priority'),
        estimated_minutes: taskRecord.getInt('estimated_minutes'),
        done: false,
        list_id: listId,
        tags: tagIds,
        created: taskRecord.getString('created'),
      }

      return toolOk(
        resultPayload,
        'Tarefa criada com sucesso: "' + title + '" (ID: ' + taskRecord.id + ')',
      )
    }

    // FERRAMENTA 2: list_tasks
    if (toolName === 'list_tasks') {
      const limit = args.limit ? Math.min(100, Math.max(1, Number(args.limit))) : 50
      let filters = ["user = '" + userId + "'"]

      // done filter: se explicitamente true ou false; se omitido, default é false
      if (args.done !== undefined && args.done !== null) {
        filters.push('done = ' + (args.done ? 'true' : 'false'))
      } else {
        filters.push('done = false')
      }

      // Filtro por data específica
      if (args.date) {
        const dStr = String(args.date).trim().slice(0, 10)
        filters.push("due_date ~ '" + dStr + "'")
      }

      // Filtro por visão temporal
      if (args.view) {
        const view = String(args.view).toLowerCase().trim()
        const now = new Date()
        const todayStr = formatIsoDate(now)

        if (view === 'inbox') {
          filters.push("(due_date = '' || due_date = null)")
        } else if (view === 'hoje') {
          // Hoje: vencem hoje ou atrasadas
          filters.push(
            "(due_date != '' && due_date != null && due_date <= '" + todayStr + " 23:59:59.999Z')",
          )
        } else if (view === 'amanhã' || view === 'amanha') {
          const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          const tomStr = formatIsoDate(tom)
          filters.push("due_date ~ '" + tomStr + "'")
        } else if (view === 'semana') {
          const endWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6)
          const endWeekStr = formatIsoDate(endWeek)
          filters.push(
            "(due_date >= '" +
              todayStr +
              " 00:00:00.000Z' && due_date <= '" +
              endWeekStr +
              " 23:59:59.999Z')",
          )
        }
      }

      // Filtro por nome de lista
      if (args.list) {
        const listName = String(args.list).trim()
        const foundLists = $app.findRecordsByFilter(
          'lists',
          "user = '" + userId + "' && name = '" + listName.replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (foundLists.length > 0) {
          filters.push("list = '" + foundLists[0].id + "'")
        } else {
          // Lista não existe, portanto não haverá tarefas
          return toolOk(
            { total: 0, tasks: [] },
            'Nenhuma tarefa encontrada para a lista "' + listName + '".',
          )
        }
      }

      // Filtro por nome de tag
      if (args.tag) {
        const tagName = String(args.tag).trim().replace(/^@/, '')
        const foundTags = $app.findRecordsByFilter(
          'tags',
          "user = '" + userId + "' && name = '" + tagName.replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (foundTags.length > 0) {
          filters.push("tags ~ '" + foundTags[0].id + "'")
        } else {
          return toolOk(
            { total: 0, tasks: [] },
            'Nenhuma tarefa encontrada com a etiqueta "' + tagName + '".',
          )
        }
      }

      const combinedFilter = filters.join(' && ')
      const taskRecords = $app.findRecordsByFilter(
        'tasks',
        combinedFilter,
        'order,due_date,created',
        limit,
        0,
      )

      // Carregar mapa de listas e tags do usuário para devolver nomes legíveis
      const userLists = $app.findRecordsByFilter('lists', "user = '" + userId + "'", '', 100, 0)
      const listMap = {}
      for (let i = 0; i < userLists.length; i++) {
        listMap[userLists[i].id] = userLists[i].getString('name')
      }

      const userTags = $app.findRecordsByFilter('tags', "user = '" + userId + "'", '', 100, 0)
      const tagMap = {}
      for (let i = 0; i < userTags.length; i++) {
        tagMap[userTags[i].id] = {
          name: userTags[i].getString('name'),
          color: userTags[i].getString('color'),
        }
      }

      const listResult = []
      for (let i = 0; i < taskRecords.length; i++) {
        const t = taskRecords[i]
        const lId = t.getString('list')
        const rawTagIds = t.getStringSlice('tags') || []
        const tagDetails = []
        for (let j = 0; j < rawTagIds.length; j++) {
          const tId = rawTagIds[j]
          if (tagMap[tId]) {
            tagDetails.push(tagMap[tId].name)
          }
        }

        listResult.push({
          id: t.id,
          title: t.getString('title'),
          due_date: t.getString('due_date'),
          due_time: t.getString('due_time'),
          priority: t.getInt('priority') || 0,
          done: t.getBool('done'),
          estimated_minutes: t.getInt('estimated_minutes'),
          actual_minutes: t.getInt('actual_minutes'),
          list: lId && listMap[lId] ? listMap[lId] : null,
          tags: tagDetails,
          order: t.getInt('order'),
          completed_at: t.getString('completed_at'),
        })
      }

      return toolOk(
        { total: listResult.length, tasks: listResult },
        'Encontradas ' +
          listResult.length +
          ' tarefa(s).' +
          (listResult.length > 0
            ? '\n' +
              listResult
                .map(function (t) {
                  return (
                    '- [' +
                    (t.done ? 'x' : ' ') +
                    '] ' +
                    t.title +
                    (t.due_date
                      ? ' (vence: ' +
                        t.due_date.slice(0, 10) +
                        (t.due_time ? ' ' + t.due_time : '') +
                        ')'
                      : '') +
                    (t.priority ? ' P' + t.priority : '') +
                    ' (id: ' +
                    t.id +
                    ')'
                  )
                })
                .join('\n')
            : ''),
      )
    }

    // FERRAMENTA 3: complete_task
    if (toolName === 'complete_task') {
      const taskId = String(args.id || '').trim()
      if (!taskId) return toolFail('O parâmetro "id" da tarefa é obrigatório.')

      let taskRecord = null
      try {
        taskRecord = $app.findFirstRecordByData('tasks', 'id', taskId)
      } catch (_) {
        return toolFail('Tarefa não encontrada com ID: ' + taskId)
      }

      if (taskRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: a tarefa pertence a outro usuário.')
      }

      const nowIso = new Date().toISOString()
      taskRecord.set('done', true)
      taskRecord.set('completed_at', nowIso)
      $app.save(taskRecord)

      let createdNextTask = null
      const recType = taskRecord.getString('recurrence_type') || 'none'

      // Se possui recorrência ativa, computar próxima data
      if (recType !== 'none') {
        const interval = Math.max(1, taskRecord.getInt('recurrence_interval') || 1)
        const recMode = taskRecord.getString('recurrence_mode') || 'from_date'
        const isFromCompletion = recMode === 'from_completion'

        const nowDate = new Date()
        let baseDate = null
        if (isFromCompletion) {
          baseDate = new Date(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate(),
            12,
            0,
            0,
          )
        } else if (taskRecord.getString('due_date')) {
          const rawDue = new Date(taskRecord.getString('due_date'))
          baseDate = new Date(
            rawDue.getUTCFullYear(),
            rawDue.getUTCMonth(),
            rawDue.getUTCDate(),
            12,
            0,
            0,
          )
        } else {
          baseDate = new Date(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate(),
            12,
            0,
            0,
          )
        }

        let nextDueDateStr = null
        if (recType === 'daily') {
          const nextD = new Date(baseDate)
          nextD.setDate(nextD.getDate() + interval)
          nextDueDateStr = formatIsoDate(nextD) + ' 12:00:00.000Z'
        } else if (recType === 'weekly') {
          const nextD = new Date(baseDate)
          nextD.setDate(nextD.getDate() + interval * 7)
          nextDueDateStr = formatIsoDate(nextD) + ' 12:00:00.000Z'
        } else if (recType === 'weekly_days') {
          let rawWeekdays = []
          try {
            const parsed = JSON.parse(taskRecord.getString('recurrence_weekdays'))
            if (Array.isArray(parsed)) rawWeekdays = parsed
          } catch (_) {}
          if (rawWeekdays.length === 0) rawWeekdays = [baseDate.getDay()]
          const sortedDays = rawWeekdays.slice().sort(function (a, b) {
            return a - b
          })

          if (isFromCompletion) {
            let daysToAdd = 1
            while (daysToAdd <= 7 * interval + 7) {
              const candidate = new Date(baseDate)
              candidate.setDate(candidate.getDate() + daysToAdd)
              if (sortedDays.indexOf(candidate.getDay()) !== -1) {
                nextDueDateStr = formatIsoDate(candidate) + ' 12:00:00.000Z'
                break
              }
              daysToAdd++
            }
          } else {
            const currentDay = baseDate.getDay()
            let nextDayThisWeek = null
            for (let k = 0; k < sortedDays.length; k++) {
              if (sortedDays[k] > currentDay) {
                nextDayThisWeek = sortedDays[k]
                break
              }
            }
            if (nextDayThisWeek !== null) {
              const diff = nextDayThisWeek - currentDay
              const nextD = new Date(baseDate)
              nextD.setDate(nextD.getDate() + diff)
              nextDueDateStr = formatIsoDate(nextD) + ' 12:00:00.000Z'
            } else {
              const firstDayNextCycle = sortedDays[0]
              const daysUntilNextWeek = 7 - currentDay
              const additionalWeeks = (interval - 1) * 7
              const totalDaysToAdd = daysUntilNextWeek + additionalWeeks + firstDayNextCycle
              const nextD = new Date(baseDate)
              nextD.setDate(nextD.getDate() + totalDaysToAdd)
              nextDueDateStr = formatIsoDate(nextD) + ' 12:00:00.000Z'
            }
          }
        } else if (recType === 'monthly') {
          const targetDay = baseDate.getDate()
          const targetYear = baseDate.getFullYear()
          const targetMonth = baseDate.getMonth() + interval
          const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
          const clampedDay = Math.min(targetDay, daysInTargetMonth)
          const nextD = new Date(targetYear, targetMonth, clampedDay, 12, 0, 0)
          nextDueDateStr = formatIsoDate(nextD) + ' 12:00:00.000Z'
        }

        if (nextDueDateStr) {
          // Resetar sub-tarefas da próxima ocorrência
          let resetSubtasks = []
          try {
            const rawSubs = JSON.parse(taskRecord.getString('subtasks'))
            if (Array.isArray(rawSubs)) {
              for (let s = 0; s < rawSubs.length; s++) {
                resetSubtasks.push({
                  id: rawSubs[s].id || $security.randomString(8),
                  title: rawSubs[s].title || '',
                  done: false,
                })
              }
            }
          } catch (_) {}

          const tasksCol = $app.findCollectionByNameOrId('tasks')
          const nextTask = new Record(tasksCol)
          nextTask.set('title', taskRecord.getString('title'))
          nextTask.set('user', userId)
          nextTask.set('list', taskRecord.getString('list'))
          nextTask.set('tags', taskRecord.getStringSlice('tags'))
          nextTask.set('due_date', nextDueDateStr)
          nextTask.set('due_time', taskRecord.getString('due_time'))
          nextTask.set('priority', taskRecord.getInt('priority'))
          nextTask.set('estimated_minutes', taskRecord.getInt('estimated_minutes') || 25)
          nextTask.set('actual_minutes', 0)
          nextTask.set('done', false)
          nextTask.set('order', (taskRecord.getInt('order') || 0) + 1)
          nextTask.set('recurrence_type', recType)
          nextTask.set('recurrence_interval', interval)
          nextTask.set('recurrence_mode', recMode)
          nextTask.set('recurrence_weekdays', taskRecord.getString('recurrence_weekdays'))
          nextTask.set('subtasks', JSON.stringify(resetSubtasks))

          $app.save(nextTask)
          createdNextTask = {
            id: nextTask.id,
            title: nextTask.getString('title'),
            due_date: nextTask.getString('due_date'),
            recurrence_type: recType,
          }
        }
      }

      return toolOk(
        {
          completed_task: {
            id: taskRecord.id,
            title: taskRecord.getString('title'),
            done: true,
            completed_at: nowIso,
          },
          created_next_task: createdNextTask,
        },
        'Tarefa concluída com sucesso!' +
          (createdNextTask
            ? ' Próxima ocorrência recorrente agendada para: ' +
              createdNextTask.due_date.slice(0, 10) +
              ' (ID: ' +
              createdNextTask.id +
              ')'
            : ''),
      )
    }

    // FERRAMENTA 4: update_task
    if (toolName === 'update_task') {
      const taskId = String(args.id || '').trim()
      if (!taskId) return toolFail('O parâmetro "id" da tarefa é obrigatório.')

      let taskRecord = null
      try {
        taskRecord = $app.findFirstRecordByData('tasks', 'id', taskId)
      } catch (_) {
        return toolFail('Tarefa não encontrada com ID: ' + taskId)
      }

      if (taskRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: a tarefa pertence a outro usuário.')
      }

      if (args.title !== undefined) {
        const trimmed = String(args.title).trim()
        if (trimmed) taskRecord.set('title', trimmed)
      }

      if (args.due_date !== undefined) {
        const dStr = String(args.due_date).trim()
        if (dStr === '') {
          taskRecord.set('due_date', '')
        } else {
          taskRecord.set('due_date', dStr.includes('T') ? dStr : dStr + ' 12:00:00.000Z')
        }
      }

      if (args.due_time !== undefined) {
        taskRecord.set('due_time', String(args.due_time).trim())
      }

      if (args.priority !== undefined) {
        const pNum = Number(args.priority)
        taskRecord.set('priority', pNum >= 0 && pNum <= 4 ? pNum : 0)
      }

      if (args.estimated_minutes !== undefined) {
        const estMin = Math.max(5, Math.min(240, Number(args.estimated_minutes)))
        taskRecord.set('estimated_minutes', estMin)
      }

      // Lista
      if (args.list !== undefined) {
        const listName = String(args.list).trim()
        if (listName === '') {
          taskRecord.set('list', '')
        } else {
          const filter = "user = '" + userId + "' && name = '" + listName.replace(/'/g, "\\'") + "'"
          const foundLists = $app.findRecordsByFilter('lists', filter, '', 1, 0)
          if (foundLists.length > 0) {
            taskRecord.set('list', foundLists[0].id)
          } else {
            const listsCol = $app.findCollectionByNameOrId('lists')
            const newList = new Record(listsCol)
            newList.set('name', listName)
            newList.set('user', userId)
            newList.set('order', 10)
            newList.set('pinned', false)
            $app.save(newList)
            taskRecord.set('list', newList.id)
          }
        }
      }

      // Tags
      if (args.tags !== undefined && Array.isArray(args.tags)) {
        let tagIds = []
        for (let i = 0; i < args.tags.length; i++) {
          const tName = String(args.tags[i] || '')
            .trim()
            .replace(/^@/, '')
          if (!tName) continue
          const tFilter = "user = '" + userId + "' && name = '" + tName.replace(/'/g, "\\'") + "'"
          const foundTags = $app.findRecordsByFilter('tags', tFilter, '', 1, 0)
          if (foundTags.length > 0) {
            tagIds.push(foundTags[0].id)
          } else {
            const userTagsCount = $app.countRecords('tags', "user = '" + userId + "'")
            const color = TAG_COLORS[userTagsCount % TAG_COLORS.length]
            const tagsCol = $app.findCollectionByNameOrId('tags')
            const newTag = new Record(tagsCol)
            newTag.set('name', tName)
            newTag.set('user', userId)
            newTag.set('color', color)
            newTag.set('order', (userTagsCount + 1) * 10)
            newTag.set('pinned', false)
            $app.save(newTag)
            tagIds.push(newTag.id)
          }
        }
        taskRecord.set('tags', tagIds)
      }

      $app.save(taskRecord)

      return toolOk(
        {
          id: taskRecord.id,
          title: taskRecord.getString('title'),
          due_date: taskRecord.getString('due_date'),
          due_time: taskRecord.getString('due_time'),
          priority: taskRecord.getInt('priority'),
          estimated_minutes: taskRecord.getInt('estimated_minutes'),
          done: taskRecord.getBool('done'),
        },
        'Tarefa atualizada com sucesso (ID: ' + taskRecord.id + ')',
      )
    }

    // FERRAMENTA 5: delete_task
    if (toolName === 'delete_task') {
      const taskId = String(args.id || '').trim()
      if (!taskId) return toolFail('O parâmetro "id" da tarefa é obrigatório.')

      let taskRecord = null
      try {
        taskRecord = $app.findFirstRecordByData('tasks', 'id', taskId)
      } catch (_) {
        return toolFail('Tarefa não encontrada com ID: ' + taskId)
      }

      if (taskRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: a tarefa pertence a outro usuário.')
      }

      const taskTitle = taskRecord.getString('title')
      $app.delete(taskRecord)

      return toolOk(
        { deleted: true, id: taskId, title: taskTitle },
        'Tarefa excluída definitivamente: "' + taskTitle + '" (ID: ' + taskId + ')',
      )
    }

    // FERRAMENTA 6: get_focus_summary
    if (toolName === 'get_focus_summary') {
      const period = String(args.period || 'hoje')
        .toLowerCase()
        .trim()
      const now = new Date()
      const todayStr = formatIsoDate(now)

      // Carregar sessões do usuário
      const sessions = $app.findRecordsByFilter(
        'sessions',
        "user = '" + userId + "'",
        '-session_date',
        500,
        0,
      )

      let totalMinutes = 0
      let sessionsCount = 0

      // Agregação por dia para cálculo do recorde absoluto (best-day)
      const dayMap = {}
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i]
        const dur = s.getInt('duration_minutes') || 0
        const rawDate = (s.getString('session_date') || s.getString('started_at') || '').slice(
          0,
          10,
        )
        if (!rawDate) continue
        if (!dayMap[rawDate]) dayMap[rawDate] = { totalMinutes: 0, count: 0 }
        dayMap[rawDate].totalMinutes += dur
        dayMap[rawDate].count += 1
      }

      // Recorde absoluto (melhor dia)
      let bestDay = null
      const dayKeys = Object.keys(dayMap)
      for (let k = 0; k < dayKeys.length; k++) {
        const dKey = dayKeys[k]
        const dData = dayMap[dKey]
        if (!bestDay || dData.totalMinutes > bestDay.total_minutes) {
          bestDay = {
            date: dKey,
            total_minutes: dData.totalMinutes,
            sessions_count: dData.count,
          }
        }
      }

      if (period === 'hoje') {
        const todayData = dayMap[todayStr] || { totalMinutes: 0, count: 0 }
        totalMinutes = todayData.totalMinutes
        sessionsCount = todayData.count
      } else if (period === 'semana') {
        const last7DaysKeys = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
          last7DaysKeys.push(formatIsoDate(d))
        }
        for (let j = 0; j < last7DaysKeys.length; j++) {
          const dKey = last7DaysKeys[j]
          if (dayMap[dKey]) {
            totalMinutes += dayMap[dKey].totalMinutes
            sessionsCount += dayMap[dKey].count
          }
        }
      } else {
        // 'todos'
        for (let i = 0; i < sessions.length; i++) {
          totalMinutes += sessions[i].getInt('duration_minutes') || 0
          sessionsCount++
        }
      }

      const summaryPayload = {
        period: period,
        total_minutes: totalMinutes,
        sessions_count: sessionsCount,
        today_minutes: dayMap[todayStr] ? dayMap[todayStr].totalMinutes : 0,
        best_day: bestDay,
        is_today_record:
          bestDay !== null &&
          dayMap[todayStr] &&
          dayMap[todayStr].totalMinutes >= bestDay.total_minutes &&
          dayMap[todayStr].totalMinutes > 0,
      }

      let textOutput =
        'Resumo de Foco (' +
        period +
        '):\n' +
        '- Minutos focados: ' +
        totalMinutes +
        ' min (' +
        Math.floor(totalMinutes / 60) +
        'h ' +
        (totalMinutes % 60) +
        'm)\n' +
        '- Sessões concluídas: ' +
        sessionsCount

      if (bestDay) {
        textOutput +=
          '\n- Recorde absoluto (Melhor Dia): ' +
          bestDay.total_minutes +
          ' min em ' +
          bestDay.date +
          ' (' +
          bestDay.sessions_count +
          ' sessões)'
      }

      return toolOk(summaryPayload, textOutput)
    }

    // FERRAMENTA 7: log_focus_session
    if (toolName === 'log_focus_session') {
      const dur = Number(args.duration_minutes)
      if (!dur || dur <= 0) {
        return toolFail('O parâmetro "duration_minutes" é obrigatório e deve ser maior que 0.')
      }

      const note = args.note ? String(args.note).slice(0, 500) : ''
      const now = new Date()
      const endedAtIso = now.toISOString()
      const startedAtDate = new Date(now.getTime() - dur * 60 * 1000)
      const startedAtIso = startedAtDate.toISOString()
      const sessionDateStr = formatIsoDate(now) + ' 12:00:00.000Z'

      let taskId = ''
      let taskTitle = 'Foco livre'
      if (args.task_id) {
        taskId = String(args.task_id).trim()
        let tRecord = null
        try {
          tRecord = $app.findFirstRecordByData('tasks', 'id', taskId)
        } catch (_) {
          return toolFail('Tarefa não encontrada com ID: ' + taskId)
        }

        if (tRecord.getString('user') !== userId) {
          return toolFail('Acesso negado: a tarefa informada pertence a outro usuário.')
        }

        taskTitle = tRecord.getString('title')
        // Atualizar actual_minutes da tarefa
        const prevActual = tRecord.getInt('actual_minutes') || 0
        tRecord.set('actual_minutes', prevActual + dur)
        $app.save(tRecord)
      }

      const sessionsCol = $app.findCollectionByNameOrId('sessions')
      const sessRecord = new Record(sessionsCol)
      sessRecord.set('user', userId)
      if (taskId) sessRecord.set('task', taskId)
      sessRecord.set('duration_minutes', dur)
      sessRecord.set('started_at', startedAtIso)
      sessRecord.set('ended_at', endedAtIso)
      sessRecord.set('session_date', sessionDateStr)
      sessRecord.set('status', 'completa')
      if (note) sessRecord.set('note', note)

      $app.save(sessRecord)

      const resultSess = {
        id: sessRecord.id,
        duration_minutes: dur,
        task_id: taskId || null,
        task_title: taskTitle,
        started_at: startedAtIso,
        ended_at: endedAtIso,
        session_date: formatIsoDate(now),
        status: 'completa',
        note: note || null,
      }

      return toolOk(
        resultSess,
        'Sessão de foco registrada com sucesso (' +
          dur +
          ' minutos em "' +
          taskTitle +
          '"). ID: ' +
          sessRecord.id,
      )
    }

    return toolFail('Ferramenta desconhecida: "' + toolName + '"')
  }

  // Método não suportado
  if (isNotification) return e.noContent(202)
  return e.json(400, makeError(-32601, 'Method not found: ' + method))
})

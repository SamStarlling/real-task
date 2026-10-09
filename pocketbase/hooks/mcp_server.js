// pocketbase/hooks/mcp_server.js
// Servidor MCP (Model Context Protocol) - Etapa 2
// Suporta JSON-RPC 2.0 via Streamable HTTP (POST e GET SSE) em /backend/v1/mcp
// e autenticação Bearer com tokens da coleção `mcp_tokens`.
// Nota de escopo JSVM: toda a lógica de handlers e parsers deve estar estritamente inline nos callbacks de routerAdd.

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
    server: 'barbosa-system-mcp/1.1',
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

  // Helper de paleta de cores para tags (8 cores oficiais do Quiet Luxury)
  const TAG_COLORS = [
    '#C5A880', // Champagne Ouro
    '#8F9E82', // Verde-Oliva Suave
    '#7E92A2', // Azul-Ardósia
    '#B37D6B', // Terracota Queimada
    '#9B6C7B', // Vinho Aveludado
    '#7D8899', // Cinza-Azulado
    '#BFA16F', // Âmbar Antigo
    '#7A8C80', // Sálvia Escura
  ]

  // Formatação de data em "YYYY-MM-DD" local
  const formatIsoDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + day
  }

  // Normalização de texto: remove acentos e converte para minúsculas
  const normalize = (value) => {
    if (!value) return ''
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  const atNoon = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)

  const MONTHS_PT = {
    janeiro: 0,
    jan: 0,
    fevereiro: 1,
    fev: 1,
    marco: 2,
    mar: 2,
    abril: 3,
    abr: 3,
    maio: 4,
    mai: 4,
    junho: 5,
    jun: 5,
    julho: 6,
    jul: 6,
    agosto: 7,
    ago: 7,
    setembro: 8,
    set: 8,
    outubro: 9,
    out: 9,
    novembro: 10,
    nov: 10,
    dezembro: 11,
    dez: 11,
  }

  const WORD_NUMBERS = {
    um: 1,
    uma: 1,
    dois: 2,
    duas: 2,
    tres: 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
    sete: 7,
    oito: 8,
    nove: 9,
    dez: 10,
    quinze: 15,
    vinte: 20,
    trinta: 30,
  }

  const WEEKDAY_INDEX = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6,
  }

  // --- PARSERS EM LINGUAGEM NATURAL INLINE ---
  // 1. Parser de Recorrência
  const parseServerRecurrence = (text) => {
    const clean = normalize(text)

    // 1. Mensal em dia específico: "todo dia 15", "todos os dias 15"
    const monthlyDayMatch = clean.match(
      /\b(?:todo|todos)\s+(?:os\s+)?dia(?:s)?\s+([1-9]|[12]\d|3[01])\b/,
    )
    if (monthlyDayMatch && monthlyDayMatch.index !== undefined) {
      return {
        type: 'monthly',
        interval: 1,
        day: Number(monthlyDayMatch[1]),
        token: text.slice(monthlyDayMatch.index, monthlyDayMatch.index + monthlyDayMatch[0].length),
        start: monthlyDayMatch.index,
        end: monthlyDayMatch.index + monthlyDayMatch[0].length,
      }
    }

    // 2. Dias úteis: "todos os dias uteis", "todo dia util", "dias uteis"
    const weekdaysMatch = clean.match(
      /\b(?:(?:todos?\s+(?:os\s+)?)?dia(?:s)?\s+uteis|todo\s+dia\s+util)\b/,
    )
    if (weekdaysMatch && weekdaysMatch.index !== undefined) {
      return {
        type: 'weekly_days',
        interval: 1,
        weekdays: [1, 2, 3, 4, 5],
        token: text.slice(weekdaysMatch.index, weekdaysMatch.index + weekdaysMatch[0].length),
        start: weekdaysMatch.index,
        end: weekdaysMatch.index + weekdaysMatch[0].length,
      }
    }

    // 3. Semanal com dias específicos: "toda segunda e quinta", "toda terca", etc.
    const weekdayNamesRegex =
      /\b(?:tod[ao]s?\s+(?:as?\s+)?)(domingos?|segundas?(?:-feira)?|tercas?(?:-feira)?|quartas?(?:-feira)?|quintas?(?:-feira)?|sextas?(?:-feira)?|sabados?(?:-feira)?)(?:\s*(?:,|e)\s*(domingos?|segundas?(?:-feira)?|tercas?(?:-feira)?|quartas?(?:-feira)?|quintas?(?:-feira)?|sextas?(?:-feira)?|sabados?(?:-feira)?))*\b/
    const weekdayRecMatch = clean.match(weekdayNamesRegex)
    if (weekdayRecMatch && weekdayRecMatch.index !== undefined) {
      const rawMatched = weekdayRecMatch[0]
      const daysFound = []
      const dayItemRegex = /(domingo|segunda|terca|quarta|quinta|sexta|sabado)/g
      let m = null
      while ((m = dayItemRegex.exec(rawMatched)) !== null) {
        const idx = WEEKDAY_INDEX[m[1]]
        if (idx !== undefined && daysFound.indexOf(idx) === -1) {
          daysFound.push(idx)
        }
      }
      if (daysFound.length > 0) {
        daysFound.sort((a, b) => a - b)
        return {
          type: 'weekly_days',
          interval: 1,
          weekdays: daysFound,
          token: text.slice(
            weekdayRecMatch.index,
            weekdayRecMatch.index + weekdayRecMatch[0].length,
          ),
          start: weekdayRecMatch.index,
          end: weekdayRecMatch.index + weekdayRecMatch[0].length,
        }
      }
    }

    // 4. "a cada N dias/semanas/meses"
    const everyNMatch = clean.match(
      /\ba\s+cada\s+(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta)\s+(dias?|semanas?|mes(?:es)?)\b/,
    )
    if (everyNMatch && everyNMatch.index !== undefined) {
      const rawQty = everyNMatch[1]
      const unit = everyNMatch[2]
      const count = /^\d+$/.test(rawQty) ? Number(rawQty) : WORD_NUMBERS[rawQty] || 1
      const recType = unit.startsWith('dia')
        ? 'daily'
        : unit.startsWith('semana')
          ? 'weekly'
          : 'monthly'
      return {
        type: recType,
        interval: Math.max(1, count),
        token: text.slice(everyNMatch.index, everyNMatch.index + everyNMatch[0].length),
        start: everyNMatch.index,
        end: everyNMatch.index + everyNMatch[0].length,
      }
    }

    // 5. Diária simples: "todo dia", "todos os dias", "diariamente"
    const dailyMatch = clean.match(/\b(?:todo\s+dia|todos\s+os\s+dias|diariamente)\b/)
    if (dailyMatch && dailyMatch.index !== undefined) {
      return {
        type: 'daily',
        interval: 1,
        token: text.slice(dailyMatch.index, dailyMatch.index + dailyMatch[0].length),
        start: dailyMatch.index,
        end: dailyMatch.index + dailyMatch[0].length,
      }
    }

    // 6. Semanal simples: "toda semana", "todas as semanas", "semanalmente"
    const weeklyMatch = clean.match(/\b(?:toda\s+semana|todas\s+as\s+semanas|semanalmente)\b/)
    if (weeklyMatch && weeklyMatch.index !== undefined) {
      return {
        type: 'weekly',
        interval: 1,
        token: text.slice(weeklyMatch.index, weeklyMatch.index + weeklyMatch[0].length),
        start: weeklyMatch.index,
        end: weeklyMatch.index + weeklyMatch[0].length,
      }
    }

    // 7. Mensal simples: "todo mes", "todos os meses", "mensalmente"
    const monthlyMatch = clean.match(/\b(?:todo\s+mes|todos\s+os\s+meses|mensalmente)\b/)
    if (monthlyMatch && monthlyMatch.index !== undefined) {
      return {
        type: 'monthly',
        interval: 1,
        token: text.slice(monthlyMatch.index, monthlyMatch.index + monthlyMatch[0].length),
        start: monthlyMatch.index,
        end: monthlyMatch.index + monthlyMatch[0].length,
      }
    }

    return null
  }

  // 2. Parser de Datas em Português
  const parseServerDate = (text, nowRef) => {
    const clean = normalize(text)
    const baseNow = nowRef || new Date()
    const currentNoon = atNoon(baseNow)

    // 1. "depois de amanhã"
    const ddaMatch = clean.match(/\bdepois\s+de\s+amanha\b/)
    if (ddaMatch && ddaMatch.index !== undefined) {
      const d = new Date(currentNoon)
      d.setDate(d.getDate() + 2)
      return {
        date: d,
        token: text.slice(ddaMatch.index, ddaMatch.index + ddaMatch[0].length),
        start: ddaMatch.index,
        end: ddaMatch.index + ddaMatch[0].length,
      }
    }

    // 2. "amanhã"
    const amgMatch = clean.match(/\bamanha\b/)
    if (amgMatch && amgMatch.index !== undefined) {
      const d = new Date(currentNoon)
      d.setDate(d.getDate() + 1)
      return {
        date: d,
        token: text.slice(amgMatch.index, amgMatch.index + amgMatch[0].length),
        start: amgMatch.index,
        end: amgMatch.index + amgMatch[0].length,
      }
    }

    // 3. "hoje"
    const hojeMatch = clean.match(/\bhoje\b/)
    if (hojeMatch && hojeMatch.index !== undefined) {
      return {
        date: new Date(currentNoon),
        token: text.slice(hojeMatch.index, hojeMatch.index + hojeMatch[0].length),
        start: hojeMatch.index,
        end: hojeMatch.index + hojeMatch[0].length,
      }
    }

    // 4. "próxima/proxima <dia_da_semana>" (salto obrigatório para a próxima semana)
    const proxMatch = clean.match(
      /\bproxim[ao]\s+(domingo|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/,
    )
    if (proxMatch && proxMatch.index !== undefined) {
      const dayKey = proxMatch[1].split('-')[0]
      const targetDay = WEEKDAY_INDEX[dayKey]
      const d = new Date(currentNoon)
      const currentDay = d.getDay()
      let delta = (targetDay - currentDay + 7) % 7
      if (delta === 0) {
        delta = 7
      } else {
        delta += 7
      }
      d.setDate(d.getDate() + delta)
      return {
        date: d,
        token: text.slice(proxMatch.index, proxMatch.index + proxMatch[0].length),
        start: proxMatch.index,
        end: proxMatch.index + proxMatch[0].length,
      }
    }

    // 5. Relativos: "em N dias/semanas/meses" ou "daqui a N dias/semanas/meses"
    const relRegex =
      /\b(?:daqui\s+(?:a\s+)?|em\s+)(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta)\s+(dias?|semanas?|mes(?:es)?)\b/
    const relMatch = clean.match(relRegex)
    if (relMatch && relMatch.index !== undefined) {
      const rawQty = relMatch[1]
      const unit = relMatch[2]
      const count = /^\d+$/.test(rawQty) ? Number(rawQty) : WORD_NUMBERS[rawQty] || 1
      const d = new Date(currentNoon)
      if (unit.indexOf('dia') === 0) {
        d.setDate(d.getDate() + count)
      } else if (unit.indexOf('semana') === 0) {
        d.setDate(d.getDate() + count * 7)
      } else if (unit.indexOf('mes') === 0) {
        d.setMonth(d.getMonth() + count)
      }
      return {
        date: d,
        token: text.slice(relMatch.index, relMatch.index + relMatch[0].length),
        start: relMatch.index,
        end: relMatch.index + relMatch[0].length,
      }
    }

    // 6. Data numérica explícita: "dd/mm/aaaa" ou "dd/mm"
    const slashRegex = /\b([0-2]?\d|3[01])\/(0?\d|1[0-2])(?:\/(\d{4}))?\b/
    const slashMatch = clean.match(slashRegex)
    if (slashMatch && slashMatch.index !== undefined) {
      const day = Number(slashMatch[1])
      const month = Number(slashMatch[2]) - 1
      let year = slashMatch[3] ? Number(slashMatch[3]) : currentNoon.getFullYear()
      let d = new Date(year, month, day, 12, 0, 0)
      if (!slashMatch[3] && d < currentNoon) {
        year = currentNoon.getFullYear() + 1
        d = new Date(year, month, day, 12, 0, 0)
      }
      return {
        date: d,
        token: text.slice(slashMatch.index, slashMatch.index + slashMatch[0].length),
        start: slashMatch.index,
        end: slashMatch.index + slashMatch[0].length,
      }
    }

    // 7. Data explícita textual: "(dia )?15 de novembro (de 2025)?"
    const textDateRegex =
      /\b(?:dia\s+)?([0-2]?\d|3[01])\s+de\s+(janeiro|jan|fevereiro|fev|marco|mar|abril|abr|maio|mai|junho|jun|julho|jul|agosto|ago|setembro|set|outubro|out|novembro|nov|dezembro|dez)(?:\s+de\s+(\d{4}))?\b/
    const textDateMatch = clean.match(textDateRegex)
    if (textDateMatch && textDateMatch.index !== undefined) {
      const day = Number(textDateMatch[1])
      const monthName = textDateMatch[2]
      const month = MONTHS_PT[monthName] !== undefined ? MONTHS_PT[monthName] : 0
      let year = textDateMatch[3] ? Number(textDateMatch[3]) : currentNoon.getFullYear()
      let d = new Date(year, month, day, 12, 0, 0)
      if (!textDateMatch[3] && d < currentNoon) {
        year = currentNoon.getFullYear() + 1
        d = new Date(year, month, day, 12, 0, 0)
      }
      return {
        date: d,
        token: text.slice(textDateMatch.index, textDateMatch.index + textDateMatch[0].length),
        start: textDateMatch.index,
        end: textDateMatch.index + textDateMatch[0].length,
      }
    }

    // 8. Dia simples do mês: "dia 15" (apenas se não precedido de "todo")
    // goja regex: sem lookbehind negativo avançado, trata com verificação de prefixo
    const dayOnlyRegex = /(?:^|\s)dia\s+([1-9]|[12]\d|3[01])\b/
    const dayOnlyMatch = clean.match(dayOnlyRegex)
    if (dayOnlyMatch && dayOnlyMatch.index !== undefined) {
      // Verifica se antes de "dia" tem "todo"
      const matchIdx = dayOnlyMatch.index + (dayOnlyMatch[0].startsWith(' ') ? 1 : 0)
      const prefix = clean.slice(Math.max(0, matchIdx - 10), matchIdx).trim()
      if (!prefix.endsWith('todo') && !prefix.endsWith('todos')) {
        const day = Number(dayOnlyMatch[1])
        let d = new Date(currentNoon.getFullYear(), currentNoon.getMonth(), day, 12, 0, 0)
        if (d < currentNoon) {
          d = new Date(currentNoon.getFullYear(), currentNoon.getMonth() + 1, day, 12, 0, 0)
        }
        const tokenLen = dayOnlyMatch[0].trim().length
        return {
          date: d,
          token: text.slice(matchIdx, matchIdx + tokenLen),
          start: matchIdx,
          end: matchIdx + tokenLen,
        }
      }
    }

    // 9. Dia da semana simples: "segunda", "terça-feira", "sábado" (próxima ocorrência)
    const weekdayRegex =
      /(?:^|\s)(domingo|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/
    const weekdayMatch = clean.match(weekdayRegex)
    if (weekdayMatch && weekdayMatch.index !== undefined) {
      const matchIdx = weekdayMatch.index + (weekdayMatch[0].startsWith(' ') ? 1 : 0)
      const prefix = clean.slice(Math.max(0, matchIdx - 10), matchIdx).trim()
      if (
        !prefix.endsWith('toda') &&
        !prefix.endsWith('todo') &&
        !prefix.endsWith('todas') &&
        !prefix.endsWith('todos') &&
        !prefix.endsWith('proxima') &&
        !prefix.endsWith('proximo')
      ) {
        const dayKey = weekdayMatch[1].split('-')[0]
        const targetDay = WEEKDAY_INDEX[dayKey]
        const d = new Date(currentNoon)
        let delta = (targetDay - d.getDay() + 7) % 7
        if (delta === 0) delta = 7
        d.setDate(d.getDate() + delta)
        const tokenLen = weekdayMatch[1].length
        return {
          date: d,
          token: text.slice(matchIdx, matchIdx + tokenLen),
          start: matchIdx,
          end: matchIdx + tokenLen,
        }
      }
    }

    return null
  }

  // 3. Parser de Horários em Português
  const parseServerTime = (text) => {
    const clean = normalize(text)

    // Padrão 1: "às/as HH:MM" ou "HH:MM"
    const colonRegex = /\b(?:as\s+|as\s*)?([01]?\d|2[0-3]):([0-5]\d)\b/
    const colonMatch = clean.match(colonRegex)
    if (colonMatch && colonMatch.index !== undefined) {
      const hours = String(Number(colonMatch[1])).padStart(2, '0')
      const minutes = colonMatch[2]
      return {
        time: hours + ':' + minutes,
        token: text.slice(colonMatch.index, colonMatch.index + colonMatch[0].length),
        start: colonMatch.index,
        end: colonMatch.index + colonMatch[0].length,
      }
    }

    // Padrão 2: "às 9h30", "14h30", "9h", "18h"
    const hRegex = /\b(?:as\s+|as\s*)?([01]?\d|2[0-3])h([0-5]\d)?\b/
    const hMatch = clean.match(hRegex)
    if (hMatch && hMatch.index !== undefined) {
      const hours = String(Number(hMatch[1])).padStart(2, '0')
      const minutes = hMatch[2] ? hMatch[2] : '00'
      return {
        time: hours + ':' + minutes,
        token: text.slice(hMatch.index, hMatch.index + hMatch[0].length),
        start: hMatch.index,
        end: hMatch.index + hMatch[0].length,
      }
    }

    return null
  }

  // 4. Parser de Prioridade: "p1".."p4" ou "!" / "!!"
  const parseServerPriority = (text) => {
    const pMatch = text.match(/(?:^|\s)(p[1-4])(?:\s|$)/i)
    if (pMatch) {
      const num = parseInt(pMatch[1].toLowerCase().replace('p', ''), 10)
      if (num >= 1 && num <= 4) {
        return { priority: num, token: pMatch[1] }
      }
    }

    const exclMatch = text.match(/(?:^|\s)(!{1,3})(?:\s|$)/)
    if (exclMatch) {
      const marks = exclMatch[1].length
      const prio = marks === 1 ? 1 : marks === 2 ? 2 : 1
      return { priority: prio, token: exclMatch[1] }
    }

    return null
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
        version: '1.1.0',
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
        name: 'capture_task',
        description:
          'Captura uma nova tarefa a partir de texto em linguagem natural em português com parser nativo no servidor. Reconhece datas (hoje, amanhã, 12/11, 15 de novembro, em 3 dias, próxima segunda), horários (às 10h, às 9h30, 14:00), recorrência (todo dia, toda semana, toda segunda e quinta, todos os dias úteis, todo dia 15, a cada duas semanas), prioridades (p1..p4, !, !!), etiquetas (@nome) e listas/projetos (#nome). Remove todos os tokens reconhecidos do título final e retorna a tarefa estruturada + resumo interpretado.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description:
                'Frase em linguagem natural da tarefa a ser capturada (ex: "revisar contrato amanhã às 10h p1 @trabalho #jurídico"). Obrigatório.',
            },
            estimated_minutes: {
              type: 'integer',
              minimum: 5,
              maximum: 240,
              description:
                'Estimativa de foco em minutos (padrão 25). Se omitido, utiliza 25 minutos.',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'create_subtasks',
        description:
          'Adiciona sub-tarefas (itens de checklist) a uma tarefa existente do usuário autenticado. Armazena a lista de sub-tarefas no campo JSON "subtasks" da coleção "tasks" mantendo a estrutura exata do aplicativo ({ id, title, done: false }). Sub-tarefas não marcam a tarefa principal e vice-versa.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'ID da tarefa pai à qual as sub-tarefas serão vinculadas (obrigatório).',
            },
            subtasks: {
              type: 'array',
              items: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      done: { type: 'boolean' },
                    },
                    required: ['title'],
                  },
                ],
              },
              description:
                'Lista de títulos ou objetos { title, done } de sub-tarefas a adicionar à tarefa.',
            },
            replace: {
              type: 'boolean',
              description:
                'Se true, substitui a lista inteira de sub-tarefas da tarefa. Se false (padrão), acrescenta aos itens já existentes.',
            },
          },
          required: ['task_id', 'subtasks'],
        },
      },
      {
        name: 'manage_tags',
        description:
          'Gerencia etiquetas/tags do usuário: listar com contagem de tarefas ("list"), criar nova etiqueta ("create"), renomear ("rename"), alterar cor ("set_color"), excluir desassociando de tarefas ("delete") e alternar selo de foco prioritário 80/20 ("pin" ou "unpin").',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'create', 'rename', 'set_color', 'delete', 'pin', 'unpin'],
              description: 'Operação a ser executada sobre as etiquetas do usuário.',
            },
            id: {
              type: 'string',
              description:
                'ID da etiqueta (obrigatório para rename, set_color, delete, pin, unpin).',
            },
            name: {
              type: 'string',
              description:
                'Nome da etiqueta (obrigatório para action "create" e "rename"). Case-insensitive.',
            },
            color: {
              type: 'string',
              description:
                'Cor hexadecimal da etiqueta (ex: "#C5A880"). Opcional para "create", obrigatório para "set_color".',
            },
          },
          required: ['action'],
        },
      },
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

    // NOVA FERRAMENTA 1: capture_task (Parser em linguagem natural no servidor)
    if (toolName === 'capture_task') {
      const rawInput = String(args.text || '').trim()
      if (!rawInput) {
        return toolFail('O parâmetro "text" com a frase da tarefa é obrigatório.')
      }

      const now = new Date()

      // 1. Parser de recorrência
      const parsedRec = parseServerRecurrence(rawInput)

      // 2. Parser de data
      const parsedDate = parseServerDate(rawInput, now)

      // 3. Parser de horário
      const parsedTime = parseServerTime(rawInput)

      // 4. Parser de prioridade
      const parsedPrio = parseServerPriority(rawInput)

      // 5. Extração de Listas (#nome) e Tags (@nome) da frase
      const listNamesFound = []
      const listRegex = /(?:^|\s)#([a-zA-Z0-9À-ÿ_\-]+)/g
      let listMatch = null
      while ((listMatch = listRegex.exec(rawInput)) !== null) {
        const lName = listMatch[1].trim()
        if (lName && listNamesFound.indexOf(lName) === -1) {
          listNamesFound.push(lName)
        }
      }

      const tagNamesFound = []
      const tagRegex = /(?:^|\s)@([a-zA-Z0-9À-ÿ_\-]+)/g
      let tagMatch = null
      while ((tagMatch = tagRegex.exec(rawInput)) !== null) {
        const tName = tagMatch[1].trim()
        if (tName && tagNamesFound.indexOf(tName) === -1) {
          tagNamesFound.push(tName)
        }
      }

      // 6. Higienização do título final: remove tokens reconhecidos
      let cleanTitle = rawInput

      if (parsedRec && parsedRec.token) {
        cleanTitle = cleanTitle.replace(parsedRec.token, ' ')
      }
      if (parsedDate && parsedDate.token) {
        cleanTitle = cleanTitle.replace(parsedDate.token, ' ')
      }
      if (parsedTime && parsedTime.token) {
        cleanTitle = cleanTitle.replace(parsedTime.token, ' ')
      }
      if (parsedPrio && parsedPrio.token) {
        // Escapa token de prioridade (ex: !, p1)
        const escaped = parsedPrio.token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        cleanTitle = cleanTitle.replace(new RegExp('(?:^|\\s)' + escaped + '(?=\\s|$)', 'i'), ' ')
      }

      // Remove tokens residuais de prioridade, listas e tags
      cleanTitle = cleanTitle
        .replace(/(?:^|\s)p[1-4](?=\s|$)/gi, ' ')
        .replace(/(?:^|\s)!+(?=\s|$)/g, ' ')
        .replace(/(?:^|\s)#[a-zA-Z0-9À-ÿ_\-]+/g, ' ')
        .replace(/(?:^|\s)@[a-zA-Z0-9À-ÿ_\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!cleanTitle) {
        cleanTitle = 'Nova tarefa'
      }

      // 7. Resolução de Lista (case-insensitive para o usuário)
      let resolvedListId = ''
      let resolvedListName = null
      if (listNamesFound.length > 0) {
        const targetListName = listNamesFound[0]
        const userLists = $app.findRecordsByFilter('lists', "user = '" + userId + "'", '', 100, 0)
        let foundListRecord = null
        for (let i = 0; i < userLists.length; i++) {
          if (
            userLists[i].getString('name').trim().toLowerCase() ===
            targetListName.trim().toLowerCase()
          ) {
            foundListRecord = userLists[i]
            break
          }
        }

        if (foundListRecord) {
          resolvedListId = foundListRecord.id
          resolvedListName = foundListRecord.getString('name')
        } else {
          // Cria nova lista
          const listsCol = $app.findCollectionByNameOrId('lists')
          const newList = new Record(listsCol)
          newList.set('name', targetListName)
          newList.set('user', userId)
          newList.set('order', 10)
          newList.set('pinned', false)
          $app.save(newList)
          resolvedListId = newList.id
          resolvedListName = targetListName
        }
      }

      // 8. Resolução de Tags (case-insensitive para o usuário)
      const resolvedTagIds = []
      const resolvedTagNames = []
      if (tagNamesFound.length > 0) {
        const userTags = $app.findRecordsByFilter('tags', "user = '" + userId + "'", '', 200, 0)
        for (let t = 0; t < tagNamesFound.length; t++) {
          const rawTag = tagNamesFound[t]
          let foundTagRecord = null
          for (let i = 0; i < userTags.length; i++) {
            if (userTags[i].getString('name').trim().toLowerCase() === rawTag.toLowerCase()) {
              foundTagRecord = userTags[i]
              break
            }
          }

          if (foundTagRecord) {
            if (resolvedTagIds.indexOf(foundTagRecord.id) === -1) {
              resolvedTagIds.push(foundTagRecord.id)
              resolvedTagNames.push(foundTagRecord.getString('name'))
            }
          } else {
            // Cria nova tag na próxima cor da paleta
            const currentCount = $app.countRecords('tags', "user = '" + userId + "'")
            const color = TAG_COLORS[currentCount % TAG_COLORS.length]
            const tagsCol = $app.findCollectionByNameOrId('tags')
            const newTag = new Record(tagsCol)
            newTag.set('name', rawTag)
            newTag.set('user', userId)
            newTag.set('color', color)
            newTag.set('order', (currentCount + 1) * 10)
            newTag.set('pinned', false)
            $app.save(newTag)
            resolvedTagIds.push(newTag.id)
            resolvedTagNames.push(rawTag)
          }
        }
      }

      // 9. Determinar data efetiva
      // Se informou horário ou recorrência e não data específica, assume hoje
      let effectiveDueDateStr = ''
      if (parsedDate) {
        effectiveDueDateStr = formatIsoDate(parsedDate.date) + ' 12:00:00.000Z'
      } else if (parsedTime || (parsedRec && parsedRec.type !== 'none')) {
        effectiveDueDateStr = formatIsoDate(now) + ' 12:00:00.000Z'
      }

      const effectiveDueTime = parsedTime ? parsedTime.time : ''
      const effectivePriority = parsedPrio ? parsedPrio.priority : 0
      const recType = parsedRec ? parsedRec.type : 'none'
      const recInterval = parsedRec ? parsedRec.interval || 1 : 1
      const recWeekdays = parsedRec && parsedRec.weekdays ? parsedRec.weekdays : null

      const estMin = args.estimated_minutes
        ? Math.max(5, Math.min(240, Number(args.estimated_minutes)))
        : 25

      // Salva no banco de dados na coleção `tasks`
      const tasksCol = $app.findCollectionByNameOrId('tasks')
      const taskRecord = new Record(tasksCol)
      taskRecord.set('title', cleanTitle)
      taskRecord.set('user', userId)
      if (resolvedListId) taskRecord.set('list', resolvedListId)
      if (resolvedTagIds.length > 0) taskRecord.set('tags', resolvedTagIds)
      if (effectiveDueDateStr) taskRecord.set('due_date', effectiveDueDateStr)
      if (effectiveDueTime) taskRecord.set('due_time', effectiveDueTime)
      if (effectivePriority > 0) taskRecord.set('priority', effectivePriority)
      taskRecord.set('estimated_minutes', estMin)
      taskRecord.set('actual_minutes', 0)
      taskRecord.set('done', false)
      taskRecord.set('recurrence_type', recType)
      taskRecord.set('recurrence_interval', recInterval)
      if (recWeekdays) taskRecord.set('recurrence_weekdays', JSON.stringify(recWeekdays))
      taskRecord.set('recurrence_mode', 'from_date')
      taskRecord.set('subtasks', JSON.stringify([]))

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

      // Monta objeto estruturado interpretado
      const interpretation = {
        title: cleanTitle,
        due_date: effectiveDueDateStr ? effectiveDueDateStr.slice(0, 10) : null,
        due_time: effectiveDueTime || null,
        priority: effectivePriority > 0 ? 'P' + effectivePriority : null,
        recurrence:
          recType !== 'none'
            ? {
                type: recType,
                interval: recInterval,
                weekdays: recWeekdays,
              }
            : null,
        tags: resolvedTagNames,
        list: resolvedListName,
      }

      const summaryParts = []
      if (interpretation.due_date) summaryParts.push('data: ' + interpretation.due_date)
      if (interpretation.due_time) summaryParts.push('horário: ' + interpretation.due_time)
      if (interpretation.priority) summaryParts.push('prioridade: ' + interpretation.priority)
      if (interpretation.recurrence) summaryParts.push('recorrência: ' + recType)
      if (interpretation.tags.length > 0)
        summaryParts.push(
          'etiquetas: ' +
            interpretation.tags
              .map(function (t) {
                return '@' + t
              })
              .join(', '),
        )
      if (interpretation.list) summaryParts.push('lista: #' + interpretation.list)

      const readableSummary =
        'Tarefa capturada com sucesso: "' +
        cleanTitle +
        '" (ID: ' +
        taskRecord.id +
        ')' +
        (summaryParts.length > 0 ? '\nInterpretado: ' + summaryParts.join(' | ') : '')

      return toolOk(
        {
          task: {
            id: taskRecord.id,
            title: taskRecord.getString('title'),
            due_date: taskRecord.getString('due_date'),
            due_time: taskRecord.getString('due_time'),
            priority: taskRecord.getInt('priority') || 0,
            estimated_minutes: taskRecord.getInt('estimated_minutes'),
            done: false,
            list: resolvedListName,
            tags: resolvedTagNames,
            recurrence_type: recType,
            recurrence_interval: recInterval,
            recurrence_weekdays: recWeekdays,
            created: taskRecord.getString('created'),
          },
          interpretation: interpretation,
        },
        readableSummary,
      )
    }

    // NOVA FERRAMENTA 2: create_subtasks (Adiciona sub-tarefas no campo JSON subtasks)
    if (toolName === 'create_subtasks') {
      const taskId = String(args.task_id || '').trim()
      if (!taskId) return toolFail('O parâmetro "task_id" é obrigatório.')

      if (!Array.isArray(args.subtasks) || args.subtasks.length === 0) {
        return toolFail('O parâmetro "subtasks" deve ser uma lista não vazia.')
      }

      let taskRecord = null
      try {
        taskRecord = $app.findFirstRecordByData('tasks', 'id', taskId)
      } catch (_) {
        return toolFail('Tarefa não encontrada com ID: ' + taskId)
      }

      if (taskRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: a tarefa pertence a outro usuário.')
      }

      // Lê sub-tarefas existentes no formato idêntico ao app: Array<{ id: string, title: string, done: boolean }>
      let currentSubtasks = []
      const rawCurrent = taskRecord.getString('subtasks')
      if (rawCurrent && rawCurrent !== 'null') {
        try {
          const parsed = JSON.parse(rawCurrent)
          if (Array.isArray(parsed)) currentSubtasks = parsed
        } catch (_) {}
      }

      const replace = args.replace === true
      const baseList = replace ? [] : currentSubtasks
      const addedItems = []

      for (let i = 0; i < args.subtasks.length; i++) {
        const item = args.subtasks[i]
        let itemTitle = ''
        let itemDone = false
        if (typeof item === 'string') {
          itemTitle = item.trim()
        } else if (item && typeof item === 'object') {
          itemTitle = String(item.title || '').trim()
          itemDone = !!item.done
        }
        if (!itemTitle) continue

        const subtaskObj = {
          id: $security.randomString(8).toLowerCase(),
          title: itemTitle,
          done: itemDone,
        }
        addedItems.push(subtaskObj)
        baseList.push(subtaskObj)
      }

      if (addedItems.length === 0) {
        return toolFail('Nenhuma sub-tarefa com título válido foi fornecida.')
      }

      taskRecord.set('subtasks', JSON.stringify(baseList))
      $app.save(taskRecord)

      return toolOk(
        {
          task_id: taskId,
          task_title: taskRecord.getString('title'),
          total_subtasks: baseList.length,
          subtasks: baseList,
          added: addedItems,
        },
        'Adicionadas ' +
          addedItems.length +
          ' sub-tarefa(s) à tarefa "' +
          taskRecord.getString('title') +
          '" (total: ' +
          baseList.length +
          ').',
      )
    }

    // NOVA FERRAMENTA 3: manage_tags (Operações sobre etiquetas do usuário)
    if (toolName === 'manage_tags') {
      const action = String(args.action || '')
        .toLowerCase()
        .trim()
      if (!action) {
        return toolFail('O parâmetro "action" é obrigatório.')
      }

      // 3.1 LIST: listar todas com contagem de tarefas vinculadas
      if (action === 'list') {
        const userTags = $app.findRecordsByFilter(
          'tags',
          "user = '" + userId + "'",
          '-pinned,order,name',
          200,
          0,
        )
        const userTasks = $app.findRecordsByFilter('tasks', "user = '" + userId + "'", '', 1000, 0)

        // Contar tarefas vinculadas a cada tag
        const tagCounts = {}
        for (let i = 0; i < userTasks.length; i++) {
          const tTags = userTasks[i].getStringSlice('tags') || []
          for (let j = 0; j < tTags.length; j++) {
            const tid = tTags[j]
            tagCounts[tid] = (tagCounts[tid] || 0) + 1
          }
        }

        const tagsResult = []
        for (let k = 0; k < userTags.length; k++) {
          const ut = userTags[k]
          tagsResult.push({
            id: ut.id,
            name: ut.getString('name'),
            color: ut.getString('color'),
            order: ut.getInt('order') || 10,
            pinned: ut.getBool('pinned'),
            tasks_count: tagCounts[ut.id] || 0,
          })
        }

        return toolOk(
          { total: tagsResult.length, tags: tagsResult },
          'Total de etiquetas: ' +
            tagsResult.length +
            (tagsResult.length > 0
              ? '\n' +
                tagsResult
                  .map(function (t) {
                    return (
                      '- @' +
                      t.name +
                      ' (' +
                      t.color +
                      ')' +
                      (t.pinned ? ' [80/20 Pinned]' : '') +
                      ' — ' +
                      t.tasks_count +
                      ' tarefa(s) [ID: ' +
                      t.id +
                      ']'
                    )
                  })
                  .join('\n')
              : ''),
        )
      }

      // 3.2 CREATE: criar nova etiqueta
      if (action === 'create') {
        const tagName = String(args.name || '')
          .trim()
          .replace(/^@/, '')
        if (!tagName) return toolFail('O parâmetro "name" da etiqueta é obrigatório.')

        // Verificar se já existe com o mesmo nome (case-insensitive)
        const existingTags = $app.findRecordsByFilter('tags', "user = '" + userId + "'", '', 200, 0)
        for (let i = 0; i < existingTags.length; i++) {
          if (existingTags[i].getString('name').trim().toLowerCase() === tagName.toLowerCase()) {
            return toolOk(
              {
                id: existingTags[i].id,
                name: existingTags[i].getString('name'),
                color: existingTags[i].getString('color'),
                order: existingTags[i].getInt('order'),
                pinned: existingTags[i].getBool('pinned'),
                already_existed: true,
              },
              'A etiqueta "@' +
                existingTags[i].getString('name') +
                '" já existia (ID: ' +
                existingTags[i].id +
                ').',
            )
          }
        }

        const count = existingTags.length
        const color = args.color ? String(args.color).trim() : TAG_COLORS[count % TAG_COLORS.length]

        const tagsCol = $app.findCollectionByNameOrId('tags')
        const newTag = new Record(tagsCol)
        newTag.set('name', tagName)
        newTag.set('user', userId)
        newTag.set('color', color)
        newTag.set('order', (count + 1) * 10)
        newTag.set('pinned', false)
        $app.save(newTag)

        return toolOk(
          {
            id: newTag.id,
            name: newTag.getString('name'),
            color: newTag.getString('color'),
            order: newTag.getInt('order'),
            pinned: false,
          },
          'Etiqueta criada com sucesso: "@' + tagName + '" (' + color + ') [ID: ' + newTag.id + ']',
        )
      }

      // Para as próximas ações, id é obrigatório
      const tagId = String(args.id || '').trim()
      if (!tagId) {
        return toolFail('O parâmetro "id" da etiqueta é obrigatório para a ação "' + action + '".')
      }

      let tagRecord = null
      try {
        tagRecord = $app.findFirstRecordByData('tags', 'id', tagId)
      } catch (_) {
        return toolFail('Etiqueta não encontrada com ID: ' + tagId)
      }

      if (tagRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: a etiqueta pertence a outro usuário.')
      }

      // 3.3 RENAME: renomeia a etiqueta
      if (action === 'rename') {
        const newName = String(args.name || '')
          .trim()
          .replace(/^@/, '')
        if (!newName) return toolFail('O novo "name" da etiqueta é obrigatório.')
        const oldName = tagRecord.getString('name')
        tagRecord.set('name', newName)
        $app.save(tagRecord)
        return toolOk(
          {
            id: tagRecord.id,
            old_name: oldName,
            name: newName,
            color: tagRecord.getString('color'),
          },
          'Etiqueta renomeada de "@' + oldName + '" para "@' + newName + '".',
        )
      }

      // 3.4 SET_COLOR: altera cor
      if (action === 'set_color') {
        const newColor = String(args.color || '').trim()
        if (!newColor) return toolFail('O parâmetro "color" é obrigatório para set_color.')
        tagRecord.set('color', newColor)
        $app.save(tagRecord)
        return toolOk(
          { id: tagRecord.id, name: tagRecord.getString('name'), color: newColor },
          'Cor da etiqueta "@' +
            tagRecord.getString('name') +
            '" atualizada para ' +
            newColor +
            '.',
        )
      }

      // 3.5 PIN / UNPIN: toggle do selo 80/20
      if (action === 'pin' || action === 'unpin') {
        const targetPinned = action === 'pin'
        tagRecord.set('pinned', targetPinned)
        $app.save(tagRecord)
        return toolOk(
          {
            id: tagRecord.id,
            name: tagRecord.getString('name'),
            pinned: targetPinned,
          },
          'Etiqueta "@' +
            tagRecord.getString('name') +
            '" ' +
            (targetPinned
              ? 'marcada como prioritária (80/20 Pinned).'
              : 'desafixada (não-prioritária).'),
        )
      }

      // 3.6 DELETE: desassocia de todas as tarefas antes de remover
      if (action === 'delete') {
        const tagName = tagRecord.getString('name')
        // Buscar todas as tarefas do usuário que possuem essa tag
        const affectedTasks = $app.findRecordsByFilter(
          'tasks',
          "user = '" + userId + "' && tags ~ '" + tagId + "'",
          '',
          500,
          0,
        )

        for (let i = 0; i < affectedTasks.length; i++) {
          const t = affectedTasks[i]
          const curTags = t.getStringSlice('tags') || []
          const filtered = curTags.filter(function (id) {
            return id !== tagId
          })
          t.set('tags', filtered)
          $app.save(t)
        }

        $app.delete(tagRecord)

        return toolOk(
          {
            deleted: true,
            id: tagId,
            name: tagName,
            tasks_unlinked: affectedTasks.length,
          },
          'Etiqueta "@' +
            tagName +
            '" excluída com sucesso e desassociada de ' +
            affectedTasks.length +
            ' tarefa(s).',
        )
      }

      return toolFail('Ação desconhecida para manage_tags: "' + action + '".')
    }

    // FERRAMENTA EXISTENTE 1: create_task
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
      taskRecord.set('subtasks', JSON.stringify([]))

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

    // FERRAMENTA EXISTENTE 2: list_tasks
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

        // Lê sub-tarefas
        let subtaskList = []
        try {
          const rawSubs = JSON.parse(t.getString('subtasks'))
          if (Array.isArray(rawSubs)) subtaskList = rawSubs
        } catch (_) {}

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
          subtasks_count: subtaskList.length,
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

    // FERRAMENTA EXISTENTE 3: complete_task
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

    // FERRAMENTA EXISTENTE 4: update_task
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

    // FERRAMENTA EXISTENTE 5: delete_task
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

    // FERRAMENTA EXISTENTE 6: get_focus_summary
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

    // FERRAMENTA EXISTENTE 7: log_focus_session
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

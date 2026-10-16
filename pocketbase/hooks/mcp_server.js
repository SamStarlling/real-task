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
          'Gerencia etiquetas/tags do usuário: listar com contagem de abertas e cor ("list"), criar nova etiqueta ("create"), renomear ("rename"), alterar cor ("set_color"), excluir desassociando de tarefas ("delete"), alternar selo de foco prioritário 80/20 ("pin" ou "unpin") e mesclar etiquetas ("merge").',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'create', 'rename', 'set_color', 'delete', 'pin', 'unpin', 'merge'],
              description: 'Operação a ser executada sobre as etiquetas do usuário.',
            },
            id: {
              type: 'string',
              description:
                'ID da etiqueta (obrigatório para rename, set_color, delete, pin, unpin, merge como origem).',
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
            target_tag_id: {
              type: 'string',
              description:
                'ID ou nome da etiqueta destino para action "merge" (as tarefas da etiqueta de origem serão migradas para esta).',
            },
            delete_source: {
              type: 'boolean',
              description:
                'Se true (padrão), exclui a etiqueta de origem após a mesclagem. Se false, mantém a etiqueta de origem vazia.',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'manage_projects',
        description:
          'Gerenciamento completo de projetos Todoist (coleção lists) e seções (project_sections) para o usuário autenticado. Ações: listar projetos com contagens ("list"), criar projeto ("create"), atualizar ("update"), arquivar/desarquivar ("archive", "unarchive"), alternar favorito ("toggle_favorite"), excluir com segurança devolvendo tarefas à Inbox ("delete"), listar seções ("list_sections"), criar seção ("create_section"), atualizar seção ("update_section") e excluir seção ("delete_section").',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: [
                'list',
                'create',
                'update',
                'archive',
                'unarchive',
                'toggle_favorite',
                'delete',
                'list_sections',
                'create_section',
                'update_section',
                'delete_section',
              ],
              description: 'Ação de gerenciamento de projetos ou seções a executar.',
            },
            id: {
              type: 'string',
              description:
                'ID do projeto (para update, archive, unarchive, toggle_favorite, delete, list_sections) ou ID da seção (para update_section, delete_section).',
            },
            name: {
              type: 'string',
              description: 'Nome do projeto ou seção (obrigatório para create e create_section).',
            },
            color: {
              type: 'string',
              description: 'Cor hexadecimal do projeto (ex: "#C5A880"). Opcional.',
            },
            goal: {
              type: 'string',
              description:
                'Objetivo mensurável do ciclo (ex: "Faturar R$10k em 12 semanas"). Opcional.',
            },
            description: {
              type: 'string',
              description:
                'Descrição do projeto. Pode conter links web ou links obsidian://. Opcional.',
            },
            favorite: {
              type: 'boolean',
              description: 'Se o projeto está marcado como favorito. Opcional.',
            },
            parent: {
              type: 'string',
              description:
                'ID ou nome de outro projeto para criar sub-projeto aninhado (ou "" para desvincular).',
            },
            project_id: {
              type: 'string',
              description:
                'ID ou nome do projeto ao qual a seção pertence (para create_section ou list_sections).',
            },
            order: {
              type: 'integer',
              description: 'Ordem de exibição do projeto ou seção. Opcional.',
            },
            include_archived: {
              type: 'boolean',
              description:
                'Se true, inclui projetos arquivados na listagem "list" (padrão false: apenas ativos).',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'manage_saved_filters',
        description:
          'Gerencia e executa filtros salvos guiados (coleção saved_filters). Ações: "list" (listar filtros do usuário), "create" (criar filtro com criteria nos 5 eixos), "update" (atualizar nome, cor, criteria, ordem), "pin" / "unpin" (fixar na seção Favoritos da sidebar), "delete" (remover filtro) e "execute" (retorna tarefas que batem com o critério do filtro salvo ou de um criteria inline).',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'create', 'update', 'pin', 'unpin', 'delete', 'execute'],
              description: 'Operação a executar sobre os filtros salvos.',
            },
            id: {
              type: 'string',
              description:
                'ID do filtro salvo (obrigatório para update, pin, unpin, delete; opcional para execute se passar criteria direto).',
            },
            name: {
              type: 'string',
              description: 'Nome do filtro salvo (obrigatório para action "create").',
            },
            color: {
              type: 'string',
              description: 'Cor hexadecimal do filtro (ex: "#C5A880"). Opcional.',
            },
            pinned: {
              type: 'boolean',
              description: 'Se o filtro deve ficar fixado na barra lateral.',
            },
            criteria: {
              type: 'object',
              properties: {
                period: {
                  type: 'string',
                  enum: ['any', 'today', 'tomorrow', 'this_week', 'overdue', 'no_date'],
                  description: 'Período temporal de vencimento.',
                },
                priority: {
                  anyOf: [
                    { type: 'string', enum: ['any'] },
                    { type: 'integer', enum: [0, 1, 2, 3, 4] },
                  ],
                  description:
                    'Prioridade da tarefa: 1=P1 urgente, 2=P2 alta, 3=P3 média, 4=P4 baixa, 0=sem prioridade, ou "any".',
                },
                tag: {
                  type: 'string',
                  description:
                    'Nome ou ID da etiqueta, "any" (qualquer) ou "none" (tarefas sem etiqueta).',
                },
                project: {
                  type: 'string',
                  description:
                    'Nome ou ID do projeto/lista, "any" (qualquer) ou "none" (tarefas sem projeto/Inbox).',
                },
                status: {
                  type: 'string',
                  enum: ['open', 'done', 'any'],
                  description:
                    'Status das tarefas: "open" (pendentes, padrão), "done" (concluídas) ou "any" (ambas).',
                },
              },
              description: 'Objeto de critérios nos 5 eixos guiados do Barbosa System.',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'create_task',
        description:
          'Cria uma nova tarefa no Barbosa System para o usuário autenticado. Permite definir título, descrição (até 5000 caracteres, com links web e obsidian://), data de vencimento (YYYY-MM-DD), horário (HH:MM), prioridade (1=P1 urgente, 2=P2 alta, 3=P3 média, 4=P4 baixa), estimativa de minutos, projeto/lista (nome ou id, criando se não existir), seção do projeto (nome ou id, criando se não existir dentro do projeto) e tags (nomes).',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Título da tarefa (obrigatório).',
            },
            description: {
              type: 'string',
              maxLength: 5000,
              description:
                'Descrição detalhada da tarefa (até 5000 caracteres). Suporta links web e obsidian://. Opcional.',
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
                'Nome ou ID do projeto onde a tarefa será alocada (ex: "Trabalho", "Ciclo 12 Semanas"). Se não existir, será criado automaticamente. Opcional.',
            },
            section: {
              type: 'string',
              description:
                'Nome ou ID da seção dentro do projeto (ex: "Saúde", "Sistemas", "Diário"). Se não existir no projeto, será criada automaticamente. Opcional.',
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
          'Lista tarefas do Barbosa System com múltiplos filtros opcionais: visão temporal ("hoje", "amanhã", "inbox", "semana"), data específica, atrasadas (overdue=true), prioridade específica (1..4), status concluído, nome ou id de lista/projeto, seção do projeto, nome de tag ou limite.',
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
            overdue: {
              type: 'boolean',
              description:
                'Se true, retorna apenas tarefas atrasadas (due_date anterior a hoje e pendentes).',
            },
            priority: {
              type: 'integer',
              enum: [1, 2, 3, 4],
              description: 'Filtrar por prioridade específica: 1=P1, 2=P2, 3=P3, 4=P4.',
            },
            tag: {
              type: 'string',
              description: 'Filtrar por nome de etiqueta/tag.',
            },
            list: {
              type: 'string',
              description: 'Filtrar por nome ou ID de lista/projeto.',
            },
            section: {
              type: 'string',
              description: 'Filtrar por nome ou ID de seção do projeto.',
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
          'Atualiza campos de uma tarefa existente: título, descrição (até 5000 chars), data, horário, prioridade, estimativa, lista/projeto, seção ou tags.',
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
            description: {
              type: 'string',
              maxLength: 5000,
              description:
                'Nova descrição detalhada da tarefa (até 5000 caracteres, com links web ou obsidian://).',
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
                'Nome ou ID do novo projeto (resolvido ou criado) ou "" para desvincular (mover para Inbox).',
            },
            section: {
              type: 'string',
              description:
                'Nome ou ID da nova seção dentro do projeto ou "" para desvincular da seção.',
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
          'Retorna o resumo métrico de foco do usuário: total de minutos focados, número de sessões concluídas e — no período "todos" — o recorde absoluto de foco (melhor dia histórico) alinhado ao módulo best-day. Permite incluir quebra estatística detalhada (donut, taxa de completude, taxa de objetivos batidos e top tarefas por tempo).',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['hoje', 'semana', '30dias', 'todos'],
              description:
                'Período de agregação do foco: "hoje" (padrão), "semana" (últimos 7 dias), "30dias" (últimos 30 dias) ou "todos" (histórico integral).',
            },
            include_breakdown: {
              type: 'boolean',
              description:
                'Se true, inclui estatísticas completas: quebra por tarefa (dados do donut), % de sessões completas, % de objetivos batidos e média por sessão.',
            },
          },
        },
      },
      {
        name: 'get_focus_stats',
        description:
          'Retorna estatísticas detalhadas de foco Pomodoro para um período (hoje, semana, 30dias, todos) com quebra por tarefa (dados do donut), tempo total focado, contagem de blocos, taxa de conclusão e taxa de objetivos batidos (veredito).',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['hoje', 'semana', '30dias', 'todos'],
              description:
                'Período de análise: "hoje", "semana" (últimos 7 dias), "30dias" ou "todos" (histórico completo). Padrão: "semana".',
            },
          },
        },
      },
      {
        name: 'log_focus_session',
        description:
          'Registra manualmente uma sessão de foco concluída para o usuário. Permite associar a uma tarefa existente (atualizando seu tempo real) ou criar foco livre, com duração em minutos, nota opcional, objetivo do bloco e veredito do bloco ("batido", "parcial" ou "nao_foi").',
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
            objective: {
              type: 'string',
              maxLength: 300,
              description:
                'Objetivo formulado para o bloco de foco (âncora anti-drift, máx. 300 caracteres). Opcional.',
            },
            outcome_status: {
              type: 'string',
              enum: ['batido', 'parcial', 'nao_foi'],
              description:
                'Veredito do bloco: "batido" (atingiu o objetivo), "parcial" (parcialmente atingido) ou "nao_foi" (não atingido). Opcional.',
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

      // 3.7 MERGE: mesclar etiqueta origem na destino
      if (action === 'merge') {
        const targetIdOrName = String(args.target_tag_id || '').trim()
        if (!targetIdOrName) {
          return toolFail('O parâmetro "target_tag_id" é obrigatório para merge.')
        }

        let targetRecord = null
        try {
          targetRecord = $app.findFirstRecordByData('tags', 'id', targetIdOrName)
        } catch (_) {}

        if (!targetRecord) {
          const cleanTargetName = targetIdOrName.replace(/^@/, '').trim().toLowerCase()
          const candidateTags = $app.findRecordsByFilter(
            'tags',
            "user = '" + userId + "'",
            '',
            200,
            0,
          )
          for (let i = 0; i < candidateTags.length; i++) {
            if (candidateTags[i].getString('name').trim().toLowerCase() === cleanTargetName) {
              targetRecord = candidateTags[i]
              break
            }
          }
        }

        if (!targetRecord) {
          return toolFail('Etiqueta destino não encontrada: ' + targetIdOrName)
        }

        if (targetRecord.getString('user') !== userId) {
          return toolFail('Acesso negado: a etiqueta destino pertence a outro usuário.')
        }

        if (targetRecord.id === tagRecord.id) {
          return toolFail('As etiquetas de origem e destino não podem ser as mesmas.')
        }

        const deleteSource = args.delete_source !== false
        const sourceName = tagRecord.getString('name')
        const targetName = targetRecord.getString('name')

        // Buscar tarefas que possuem a tag de origem
        const tasksWithSource = $app.findRecordsByFilter(
          'tasks',
          "user = '" + userId + "' && tags ~ '" + tagRecord.id + "'",
          '',
          1000,
          0,
        )

        let tasksMigrated = 0
        for (let i = 0; i < tasksWithSource.length; i++) {
          const t = tasksWithSource[i]
          const currentTags = t.getStringSlice('tags') || []
          let updatedTags = currentTags.filter(function (tid) {
            return tid !== tagRecord.id
          })
          if (updatedTags.indexOf(targetRecord.id) === -1) {
            updatedTags.push(targetRecord.id)
          }
          t.set('tags', updatedTags)
          $app.save(t)
          tasksMigrated++
        }

        if (deleteSource) {
          $app.delete(tagRecord)
        }

        return toolOk(
          {
            merged: true,
            source_tag_id: tagRecord.id,
            source_tag_name: sourceName,
            target_tag_id: targetRecord.id,
            target_tag_name: targetName,
            tasks_migrated: tasksMigrated,
            source_deleted: deleteSource,
          },
          'Mesclagem concluída: ' +
            tasksMigrated +
            ' tarefa(s) migradas de "@' +
            sourceName +
            '" para "@' +
            targetName +
            '".' +
            (deleteSource ? ' Etiqueta de origem excluída.' : ''),
        )
      }

      return toolFail('Ação desconhecida para manage_tags: "' + action + '".')
    }

    // FERRAMENTA NOVA: manage_projects (Gerenciamento completo de projetos Todoist e seções)
    if (toolName === 'manage_projects') {
      const action = String(args.action || '')
        .toLowerCase()
        .trim()
      if (!action) return toolFail('O parâmetro "action" é obrigatório.')

      // 1. LIST: listar projetos com contagem de tarefas abertas/concluídas
      if (action === 'list') {
        const includeArchived = args.include_archived === true
        let listFilter = "user = '" + userId + "'"
        if (!includeArchived) {
          listFilter += ' && archived = false'
        }

        const projectRecords = $app.findRecordsByFilter(
          'lists',
          listFilter,
          '-pinned,-favorite,order,name',
          200,
          0,
        )

        // Contagem de tarefas abertas e concluídas por projeto
        const userTasks = $app.findRecordsByFilter('tasks', "user = '" + userId + "'", '', 1000, 0)
        const openCounts = {}
        const doneCounts = {}
        for (let i = 0; i < userTasks.length; i++) {
          const pId = userTasks[i].getString('list')
          if (!pId) continue
          const isDone = userTasks[i].getBool('done')
          if (isDone) {
            doneCounts[pId] = (doneCounts[pId] || 0) + 1
          } else {
            openCounts[pId] = (openCounts[pId] || 0) + 1
          }
        }

        const projectsResult = []
        for (let j = 0; j < projectRecords.length; j++) {
          const pr = projectRecords[j]
          projectsResult.push({
            id: pr.id,
            name: pr.getString('name'),
            color: pr.getString('color') || '#C5A880',
            goal: pr.getString('goal') || null,
            description: pr.getString('description') || null,
            favorite: pr.getBool('favorite'),
            archived: pr.getBool('archived'),
            parent: pr.getString('parent') || null,
            order: pr.getInt('order') || 10,
            pinned: pr.getBool('pinned'),
            open_tasks_count: openCounts[pr.id] || 0,
            done_tasks_count: doneCounts[pr.id] || 0,
          })
        }

        return toolOk(
          { total: projectsResult.length, projects: projectsResult },
          'Total de projetos: ' +
            projectsResult.length +
            (projectsResult.length > 0
              ? '\n' +
                projectsResult
                  .map(function (p) {
                    return (
                      '- ' +
                      p.name +
                      ' (' +
                      p.color +
                      ')' +
                      (p.favorite ? ' [★ Favorito]' : '') +
                      (p.archived ? ' [Arquivado]' : '') +
                      ' — ' +
                      p.open_tasks_count +
                      ' abertas, ' +
                      p.done_tasks_count +
                      ' concluídas' +
                      (p.goal ? ' | Meta: "' + p.goal + '"' : '') +
                      ' [ID: ' +
                      p.id +
                      ']'
                    )
                  })
                  .join('\n')
              : ''),
        )
      }

      // 2. CREATE: criar novo projeto
      if (action === 'create') {
        const pName = String(args.name || '').trim()
        if (!pName) return toolFail('O parâmetro "name" do projeto é obrigatório.')

        // Verificar se já existe com o mesmo nome para este usuário
        const existing = $app.findRecordsByFilter(
          'lists',
          "user = '" + userId + "' && name = '" + pName.replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (existing.length > 0) {
          return toolOk(
            {
              id: existing[0].id,
              name: existing[0].getString('name'),
              color: existing[0].getString('color'),
              goal: existing[0].getString('goal'),
              description: existing[0].getString('description'),
              favorite: existing[0].getBool('favorite'),
              archived: existing[0].getBool('archived'),
              parent: existing[0].getString('parent') || null,
              already_existed: true,
            },
            'O projeto "' + pName + '" já existia (ID: ' + existing[0].id + ').',
          )
        }

        // Resolver parent se fornecido por id ou nome
        let resolvedParentId = ''
        if (args.parent && String(args.parent).trim()) {
          const parentArg = String(args.parent).trim()
          try {
            const pRec = $app.findFirstRecordByData('lists', 'id', parentArg)
            if (pRec && pRec.getString('user') === userId) {
              resolvedParentId = pRec.id
            }
          } catch (_) {
            const pByName = $app.findRecordsByFilter(
              'lists',
              "user = '" + userId + "' && name = '" + parentArg.replace(/'/g, "\\'") + "'",
              '',
              1,
              0,
            )
            if (pByName.length > 0) resolvedParentId = pByName[0].id
          }
        }

        const listsCol = $app.findCollectionByNameOrId('lists')
        const newProj = new Record(listsCol)
        newProj.set('name', pName)
        newProj.set('user', userId)
        newProj.set('color', args.color ? String(args.color).trim() : '#C5A880')
        if (args.goal !== undefined) newProj.set('goal', String(args.goal).trim())
        if (args.description !== undefined) {
          newProj.set('description', String(args.description).slice(0, 5000))
        }
        newProj.set('favorite', args.favorite === true)
        newProj.set('archived', false)
        if (resolvedParentId) newProj.set('parent', resolvedParentId)
        newProj.set('order', args.order !== undefined ? Number(args.order) : 10)
        newProj.set('pinned', false)

        $app.save(newProj)

        return toolOk(
          {
            id: newProj.id,
            name: newProj.getString('name'),
            color: newProj.getString('color'),
            goal: newProj.getString('goal'),
            description: newProj.getString('description'),
            favorite: newProj.getBool('favorite'),
            archived: false,
            parent: resolvedParentId || null,
            order: newProj.getInt('order'),
          },
          'Projeto "' + pName + '" criado com sucesso (ID: ' + newProj.id + ').',
        )
      }

      // 3. CREATE_SECTION: criar seção em um projeto
      if (action === 'create_section') {
        const secName = String(args.name || '').trim()
        if (!secName) return toolFail('O parâmetro "name" da seção é obrigatório.')

        const projIdOrName = String(args.project_id || args.id || '').trim()
        if (!projIdOrName) {
          return toolFail(
            'O parâmetro "project_id" (ou "id" do projeto) é obrigatório para criar seção.',
          )
        }

        let projRecord = null
        try {
          projRecord = $app.findFirstRecordByData('lists', 'id', projIdOrName)
        } catch (_) {
          const byName = $app.findRecordsByFilter(
            'lists',
            "user = '" + userId + "' && name = '" + projIdOrName.replace(/'/g, "\\'") + "'",
            '',
            1,
            0,
          )
          if (byName.length > 0) projRecord = byName[0]
        }

        if (!projRecord) {
          return toolFail('Projeto não encontrado para vincular a seção: ' + projIdOrName)
        }
        if (projRecord.getString('user') !== userId) {
          return toolFail('Acesso negado: o projeto pertence a outro usuário.')
        }

        // Verificar se seção já existe no projeto
        const existingSections = $app.findRecordsByFilter(
          'project_sections',
          "project = '" + projRecord.id + "'",
          'order',
          100,
          0,
        )
        for (let i = 0; i < existingSections.length; i++) {
          if (
            existingSections[i].getString('name').trim().toLowerCase() === secName.toLowerCase()
          ) {
            return toolOk(
              {
                id: existingSections[i].id,
                name: existingSections[i].getString('name'),
                project_id: projRecord.id,
                project_name: projRecord.getString('name'),
                order: existingSections[i].getInt('order'),
                already_existed: true,
              },
              'A seção "' +
                secName +
                '" já existia no projeto "' +
                projRecord.getString('name') +
                '" (ID: ' +
                existingSections[i].id +
                ').',
            )
          }
        }

        const secCount = existingSections.length
        const nextSecOrder = args.order !== undefined ? Number(args.order) : (secCount + 1) * 10

        const sectionsCol = $app.findCollectionByNameOrId('project_sections')
        const newSec = new Record(sectionsCol)
        newSec.set('name', secName)
        newSec.set('project', projRecord.id)
        newSec.set('user', userId)
        newSec.set('order', nextSecOrder)
        $app.save(newSec)

        return toolOk(
          {
            id: newSec.id,
            name: newSec.getString('name'),
            project_id: projRecord.id,
            project_name: projRecord.getString('name'),
            order: newSec.getInt('order'),
          },
          'Seção "' +
            secName +
            '" criada no projeto "' +
            projRecord.getString('name') +
            '" (ID: ' +
            newSec.id +
            ').',
        )
      }

      // 4. LIST_SECTIONS: listar seções de um projeto (ou todas do usuário)
      if (action === 'list_sections') {
        const projIdOrName = String(args.project_id || args.id || '').trim()
        let filter = "user = '" + userId + "'"
        let projNameResolved = null

        if (projIdOrName) {
          let pRec = null
          try {
            pRec = $app.findFirstRecordByData('lists', 'id', projIdOrName)
          } catch (_) {
            const byName = $app.findRecordsByFilter(
              'lists',
              "user = '" + userId + "' && name = '" + projIdOrName.replace(/'/g, "\\'") + "'",
              '',
              1,
              0,
            )
            if (byName.length > 0) pRec = byName[0]
          }
          if (pRec) {
            filter += " && project = '" + pRec.id + "'"
            projNameResolved = pRec.getString('name')
          }
        }

        const sections = $app.findRecordsByFilter('project_sections', filter, 'order,name', 200, 0)
        const resultSecs = []
        for (let i = 0; i < sections.length; i++) {
          resultSecs.push({
            id: sections[i].id,
            name: sections[i].getString('name'),
            project_id: sections[i].getString('project'),
            order: sections[i].getInt('order'),
          })
        }

        return toolOk(
          { total: resultSecs.length, sections: resultSecs },
          'Total de seções: ' +
            resultSecs.length +
            (projNameResolved ? ' no projeto "' + projNameResolved + '"' : '') +
            (resultSecs.length > 0
              ? '\n' +
                resultSecs
                  .map(function (s) {
                    return '- ' + s.name + ' [ID: ' + s.id + ' | Ordem: ' + s.order + ']'
                  })
                  .join('\n')
              : ''),
        )
      }

      // 5. UPDATE_SECTION: atualizar nome ou ordem de uma seção
      if (action === 'update_section') {
        const secId = String(args.id || '').trim()
        if (!secId) return toolFail('O parâmetro "id" da seção é obrigatório para update_section.')

        let secRecord = null
        try {
          secRecord = $app.findFirstRecordByData('project_sections', 'id', secId)
        } catch (_) {
          return toolFail('Seção não encontrada com ID: ' + secId)
        }
        if (secRecord.getString('user') !== userId) {
          return toolFail('Acesso negado: a seção pertence a outro usuário.')
        }

        if (args.name !== undefined && String(args.name).trim()) {
          secRecord.set('name', String(args.name).trim())
        }
        if (args.order !== undefined) {
          secRecord.set('order', Number(args.order))
        }
        $app.save(secRecord)

        return toolOk(
          {
            id: secRecord.id,
            name: secRecord.getString('name'),
            project_id: secRecord.getString('project'),
            order: secRecord.getInt('order'),
          },
          'Seção atualizada com sucesso (ID: ' + secRecord.id + ').',
        )
      }

      // 6. DELETE_SECTION: excluir seção e desvincular tarefas da seção
      if (action === 'delete_section') {
        const secId = String(args.id || '').trim()
        if (!secId) return toolFail('O parâmetro "id" da seção é obrigatório para delete_section.')

        let secRecord = null
        try {
          secRecord = $app.findFirstRecordByData('project_sections', 'id', secId)
        } catch (_) {
          return toolFail('Seção não encontrada com ID: ' + secId)
        }
        if (secRecord.getString('user') !== userId) {
          return toolFail('Acesso negado: a seção pertence a outro usuário.')
        }

        const secName = secRecord.getString('name')
        // Desvincular tarefas com esta seção (set section = '')
        const tasksInSection = $app.findRecordsByFilter(
          'tasks',
          "user = '" + userId + "' && section = '" + secId + "'",
          '',
          500,
          0,
        )
        for (let i = 0; i < tasksInSection.length; i++) {
          tasksInSection[i].set('section', '')
          $app.save(tasksInSection[i])
        }

        $app.delete(secRecord)

        return toolOk(
          {
            deleted: true,
            id: secId,
            name: secName,
            tasks_unlinked: tasksInSection.length,
          },
          'Seção "' +
            secName +
            '" excluída com sucesso (' +
            tasksInSection.length +
            ' tarefa(s) desvinculadas da seção).',
        )
      }

      // Ações sobre o projeto: id obrigatório
      const projId = String(args.id || '').trim()
      if (!projId) {
        return toolFail('O parâmetro "id" do projeto é obrigatório para a ação "' + action + '".')
      }

      let projRecord = null
      try {
        projRecord = $app.findFirstRecordByData('lists', 'id', projId)
      } catch (_) {
        // Tenta resolver por nome se não achou por ID direto
        const byName = $app.findRecordsByFilter(
          'lists',
          "user = '" + userId + "' && name = '" + projId.replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (byName.length > 0) projRecord = byName[0]
      }

      if (!projRecord) {
        return toolFail('Projeto não encontrado com identificador: ' + projId)
      }
      if (projRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: o projeto pertence a outro usuário.')
      }

      // 7. UPDATE: atualizar campos do projeto
      if (action === 'update') {
        if (args.name !== undefined && String(args.name).trim()) {
          projRecord.set('name', String(args.name).trim())
        }
        if (args.color !== undefined && String(args.color).trim()) {
          projRecord.set('color', String(args.color).trim())
        }
        if (args.goal !== undefined) {
          projRecord.set('goal', String(args.goal).trim())
        }
        if (args.description !== undefined) {
          projRecord.set('description', String(args.description).slice(0, 5000))
        }
        if (args.favorite !== undefined) {
          projRecord.set('favorite', args.favorite === true)
        }
        if (args.archived !== undefined) {
          projRecord.set('archived', args.archived === true)
        }
        if (args.parent !== undefined) {
          const parentArg = String(args.parent).trim()
          if (!parentArg) {
            projRecord.set('parent', '')
          } else {
            let pid = ''
            try {
              const p = $app.findFirstRecordByData('lists', 'id', parentArg)
              if (p && p.getString('user') === userId && p.id !== projRecord.id) pid = p.id
            } catch (_) {
              const pList = $app.findRecordsByFilter(
                'lists',
                "user = '" + userId + "' && name = '" + parentArg.replace(/'/g, "\\'") + "'",
                '',
                1,
                0,
              )
              if (pList.length > 0 && pList[0].id !== projRecord.id) pid = pList[0].id
            }
            projRecord.set('parent', pid)
          }
        }
        if (args.order !== undefined) {
          projRecord.set('order', Number(args.order))
        }

        $app.save(projRecord)

        return toolOk(
          {
            id: projRecord.id,
            name: projRecord.getString('name'),
            color: projRecord.getString('color'),
            goal: projRecord.getString('goal'),
            description: projRecord.getString('description'),
            favorite: projRecord.getBool('favorite'),
            archived: projRecord.getBool('archived'),
            parent: projRecord.getString('parent') || null,
            order: projRecord.getInt('order'),
          },
          'Projeto "' + projRecord.getString('name') + '" atualizado com sucesso.',
        )
      }

      // 8. ARCHIVE / UNARCHIVE
      if (action === 'archive' || action === 'unarchive') {
        const isArchive = action === 'archive'
        projRecord.set('archived', isArchive)
        $app.save(projRecord)
        return toolOk(
          {
            id: projRecord.id,
            name: projRecord.getString('name'),
            archived: isArchive,
          },
          'Projeto "' +
            projRecord.getString('name') +
            '" ' +
            (isArchive ? 'arquivado com sucesso.' : 'desarquivado com sucesso.'),
        )
      }

      // 9. TOGGLE_FAVORITE
      if (action === 'toggle_favorite') {
        const currentFav = projRecord.getBool('favorite')
        const nextFav = args.favorite !== undefined ? args.favorite === true : !currentFav
        projRecord.set('favorite', nextFav)
        $app.save(projRecord)
        return toolOk(
          {
            id: projRecord.id,
            name: projRecord.getString('name'),
            favorite: nextFav,
          },
          'Projeto "' +
            projRecord.getString('name') +
            '" ' +
            (nextFav ? 'marcado como favorito.' : 'removido dos favoritos.'),
        )
      }

      // 10. DELETE: desvincular tarefas (mover para Inbox) e excluir seções e o projeto
      if (action === 'delete') {
        const pName = projRecord.getString('name')

        // 10.1 Desvincular todas as tarefas vinculadas a este projeto (list = null / '')
        const linkedTasks = $app.findRecordsByFilter(
          'tasks',
          "user = '" + userId + "' && list = '" + projRecord.id + "'",
          '',
          1000,
          0,
        )
        for (let i = 0; i < linkedTasks.length; i++) {
          linkedTasks[i].set('list', '')
          linkedTasks[i].set('section', '')
          $app.save(linkedTasks[i])
        }

        // 10.2 Excluir seções associadas a este projeto
        const linkedSections = $app.findRecordsByFilter(
          'project_sections',
          "project = '" + projRecord.id + "'",
          '',
          100,
          0,
        )
        for (let j = 0; j < linkedSections.length; j++) {
          $app.delete(linkedSections[j])
        }

        // 10.3 Desvincular sub-projetos filhos (parent = null)
        const childProjects = $app.findRecordsByFilter(
          'lists',
          "user = '" + userId + "' && parent = '" + projRecord.id + "'",
          '',
          100,
          0,
        )
        for (let k = 0; k < childProjects.length; k++) {
          childProjects[k].set('parent', '')
          $app.save(childProjects[k])
        }

        $app.delete(projRecord)

        return toolOk(
          {
            deleted: true,
            id: projId,
            name: pName,
            tasks_returned_to_inbox: linkedTasks.length,
            sections_deleted: linkedSections.length,
            children_unlinked: childProjects.length,
          },
          'Projeto "' +
            pName +
            '" excluído com sucesso. ' +
            linkedTasks.length +
            ' tarefa(s) devolvidas à Inbox.',
        )
      }

      return toolFail('Ação desconhecida para manage_projects: "' + action + '".')
    }

    // FERRAMENTA NOVA: manage_saved_filters (Filtros salvos guiados e execução)
    if (toolName === 'manage_saved_filters') {
      const action = String(args.action || '')
        .toLowerCase()
        .trim()
      if (!action) return toolFail('O parâmetro "action" é obrigatório.')

      // Função auxiliar para testar se uma tarefa bate com criteria nos 5 eixos
      const taskMatchesCriteria = function (taskRec, criteria, tagMap, listMap) {
        if (!criteria || typeof criteria !== 'object') return true

        // 1. Status (open | done | any)
        const statusReq = criteria.status || 'open'
        const isDone = taskRec.getBool('done')
        if (statusReq === 'open' && isDone) return false
        if (statusReq === 'done' && !isDone) return false

        // 2. Prioridade (any | 0..4)
        if (criteria.priority !== undefined && criteria.priority !== 'any') {
          const reqPrio = Number(criteria.priority)
          const taskPrio = taskRec.getInt('priority') || 0
          if (taskPrio !== reqPrio) return false
        }

        // 3. Período
        if (criteria.period && criteria.period !== 'any') {
          const rawDue = taskRec.getString('due_date')
          const now = new Date()
          const todayIso = formatIsoDate(now)

          if (criteria.period === 'no_date') {
            if (rawDue && rawDue.trim() !== '') return false
          } else {
            if (!rawDue || rawDue.trim() === '') return false
            const taskDateIso = rawDue.slice(0, 10)

            if (criteria.period === 'today') {
              if (taskDateIso !== todayIso) return false
            } else if (criteria.period === 'tomorrow') {
              const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
              const tomIso = formatIsoDate(tom)
              if (taskDateIso !== tomIso) return false
            } else if (criteria.period === 'overdue') {
              if (taskDateIso >= todayIso) return false
            } else if (criteria.period === 'this_week') {
              const dayOfWeek = now.getDay()
              const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
              const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon)
              const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
              const monIso = formatIsoDate(mon)
              const sunIso = formatIsoDate(sun)
              if (taskDateIso < monIso || taskDateIso > sunIso) return false
            }
          }
        }

        // 4. Etiqueta (any | none | id/nome)
        if (criteria.tag && criteria.tag !== 'any') {
          const taskTags = taskRec.getStringSlice('tags') || []
          if (criteria.tag === 'none') {
            if (taskTags.length > 0) return false
          } else {
            const reqTagStr = String(criteria.tag).toLowerCase().replace(/^@/, '').trim()
            let matchedTag = false
            for (let t = 0; t < taskTags.length; t++) {
              const tid = taskTags[t]
              if (tid === reqTagStr) {
                matchedTag = true
                break
              }
              if (tagMap[tid] && tagMap[tid].name.toLowerCase() === reqTagStr) {
                matchedTag = true
                break
              }
            }
            if (!matchedTag) return false
          }
        }

        // 5. Projeto (any | none | id/nome)
        if (criteria.project && criteria.project !== 'any') {
          const taskListId = taskRec.getString('list')
          if (criteria.project === 'none') {
            if (taskListId && taskListId.trim() !== '') return false
          } else {
            const reqProjStr = String(criteria.project).toLowerCase().trim()
            if (taskListId === reqProjStr) {
              // match direto por ID
            } else if (listMap[taskListId] && listMap[taskListId].toLowerCase() === reqProjStr) {
              // match por nome
            } else {
              return false
            }
          }
        }

        return true
      }

      // 1. LIST: listar filtros salvos
      if (action === 'list') {
        const savedRecords = $app.findRecordsByFilter(
          'saved_filters',
          "user = '" + userId + "'",
          '-pinned,order,name',
          100,
          0,
        )

        const filtersResult = []
        for (let i = 0; i < savedRecords.length; i++) {
          const sf = savedRecords[i]
          let parsedCriteria = {
            period: 'any',
            priority: 'any',
            tag: 'any',
            project: 'any',
            status: 'open',
          }
          const rawCrit = sf.getString('criteria')
          if (rawCrit) {
            try {
              parsedCriteria = JSON.parse(rawCrit)
            } catch (_) {}
          }
          filtersResult.push({
            id: sf.id,
            name: sf.getString('name'),
            color: sf.getString('color') || '#C5A880',
            criteria: parsedCriteria,
            pinned: sf.getBool('pinned'),
            order: sf.getInt('order') || 10,
          })
        }

        return toolOk(
          { total: filtersResult.length, saved_filters: filtersResult },
          'Total de filtros salvos: ' +
            filtersResult.length +
            (filtersResult.length > 0
              ? '\n' +
                filtersResult
                  .map(function (f) {
                    return (
                      '- ' +
                      f.name +
                      (f.pinned ? ' [Pinned na Sidebar]' : '') +
                      ' (' +
                      f.color +
                      ') [ID: ' +
                      f.id +
                      ']'
                    )
                  })
                  .join('\n')
              : ''),
        )
      }

      // 2. CREATE: criar filtro salvo
      if (action === 'create') {
        const filterName = String(args.name || '').trim()
        if (!filterName) return toolFail('O parâmetro "name" do filtro é obrigatório.')

        const crit = args.criteria && typeof args.criteria === 'object' ? args.criteria : {}
        const defaultCriteria = {
          period: crit.period || 'any',
          priority: crit.priority !== undefined ? crit.priority : 'any',
          tag: crit.tag || 'any',
          project: crit.project || 'any',
          status: crit.status || 'open',
        }

        const count = $app.countRecords('saved_filters', "user = '" + userId + "'")
        const nextOrder = (count + 1) * 10
        const color = args.color ? String(args.color).trim() : '#C5A880'

        const filtersCol = $app.findCollectionByNameOrId('saved_filters')
        const newSf = new Record(filtersCol)
        newSf.set('name', filterName)
        newSf.set('user', userId)
        newSf.set('color', color)
        newSf.set('criteria', JSON.stringify(defaultCriteria))
        newSf.set('pinned', args.pinned === true)
        newSf.set('order', nextOrder)
        $app.save(newSf)

        return toolOk(
          {
            id: newSf.id,
            name: newSf.getString('name'),
            color: newSf.getString('color'),
            criteria: defaultCriteria,
            pinned: newSf.getBool('pinned'),
            order: newSf.getInt('order'),
          },
          'Filtro salvo criado com sucesso: "' + filterName + '" (ID: ' + newSf.id + ').',
        )
      }

      // 3. EXECUTE: executar filtro salvo por ID ou via criteria inline
      if (action === 'execute') {
        let activeCriteria = null
        let filterDisplayName = 'Critério inline'

        if (args.id && String(args.id).trim()) {
          const sfId = String(args.id).trim()
          let sfRecord = null
          try {
            sfRecord = $app.findFirstRecordByData('saved_filters', 'id', sfId)
          } catch (_) {
            const byName = $app.findRecordsByFilter(
              'saved_filters',
              "user = '" + userId + "' && name = '" + sfId.replace(/'/g, "\\'") + "'",
              '',
              1,
              0,
            )
            if (byName.length > 0) sfRecord = byName[0]
          }
          if (sfRecord) {
            if (sfRecord.getString('user') !== userId) {
              return toolFail('Acesso negado: o filtro pertence a outro usuário.')
            }
            filterDisplayName = sfRecord.getString('name')
            try {
              activeCriteria = JSON.parse(sfRecord.getString('criteria'))
            } catch (_) {}
          }
        }

        if (!activeCriteria && args.criteria && typeof args.criteria === 'object') {
          activeCriteria = args.criteria
        }

        if (!activeCriteria) {
          activeCriteria = {
            period: 'any',
            priority: 'any',
            tag: 'any',
            project: 'any',
            status: 'open',
          }
        }

        // Carregar listas e tags do usuário
        const userLists = $app.findRecordsByFilter('lists', "user = '" + userId + "'", '', 100, 0)
        const listMap = {}
        for (let i = 0; i < userLists.length; i++) {
          listMap[userLists[i].id] = userLists[i].getString('name')
        }

        const userTags = $app.findRecordsByFilter('tags', "user = '" + userId + "'", '', 200, 0)
        const tagMap = {}
        for (let i = 0; i < userTags.length; i++) {
          tagMap[userTags[i].id] = {
            name: userTags[i].getString('name'),
            color: userTags[i].getString('color'),
          }
        }

        // Buscar tarefas do usuário e aplicar criteria nos 5 eixos
        const userTasks = $app.findRecordsByFilter(
          'tasks',
          "user = '" + userId + "'",
          'order,due_date,created',
          1000,
          0,
        )

        const matchingTasks = []
        for (let i = 0; i < userTasks.length; i++) {
          const t = userTasks[i]
          if (taskMatchesCriteria(t, activeCriteria, tagMap, listMap)) {
            const lId = t.getString('list')
            const rawTagIds = t.getStringSlice('tags') || []
            const tagNames = []
            for (let j = 0; j < rawTagIds.length; j++) {
              if (tagMap[rawTagIds[j]]) tagNames.push(tagMap[rawTagIds[j]].name)
            }

            matchingTasks.push({
              id: t.id,
              title: t.getString('title'),
              due_date: t.getString('due_date'),
              due_time: t.getString('due_time'),
              priority: t.getInt('priority') || 0,
              done: t.getBool('done'),
              list: lId && listMap[lId] ? listMap[lId] : null,
              section: t.getString('section') || null,
              tags: tagNames,
              order: t.getInt('order'),
            })
          }
        }

        return toolOk(
          {
            filter_name: filterDisplayName,
            criteria: activeCriteria,
            total: matchingTasks.length,
            tasks: matchingTasks,
          },
          'Execução do filtro "' +
            filterDisplayName +
            '": ' +
            matchingTasks.length +
            ' tarefa(s) encontrada(s).' +
            (matchingTasks.length > 0
              ? '\n' +
                matchingTasks
                  .map(function (t) {
                    return (
                      '- [' +
                      (t.done ? 'x' : ' ') +
                      '] ' +
                      t.title +
                      (t.due_date ? ' (vence: ' + t.due_date.slice(0, 10) + ')' : '') +
                      (t.priority ? ' P' + t.priority : '') +
                      (t.list ? ' #' + t.list : '') +
                      ' [ID: ' +
                      t.id +
                      ']'
                    )
                  })
                  .join('\n')
              : ''),
        )
      }

      // Demais ações requerem id
      const sfId = String(args.id || '').trim()
      if (!sfId) {
        return toolFail(
          'O parâmetro "id" do filtro salvo é obrigatório para a ação "' + action + '".',
        )
      }

      let sfRecord = null
      try {
        sfRecord = $app.findFirstRecordByData('saved_filters', 'id', sfId)
      } catch (_) {
        const byName = $app.findRecordsByFilter(
          'saved_filters',
          "user = '" + userId + "' && name = '" + sfId.replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (byName.length > 0) sfRecord = byName[0]
      }

      if (!sfRecord) {
        return toolFail('Filtro salvo não encontrado com identificador: ' + sfId)
      }
      if (sfRecord.getString('user') !== userId) {
        return toolFail('Acesso negado: o filtro salvo pertence a outro usuário.')
      }

      // 4. UPDATE
      if (action === 'update') {
        if (args.name !== undefined && String(args.name).trim()) {
          sfRecord.set('name', String(args.name).trim())
        }
        if (args.color !== undefined && String(args.color).trim()) {
          sfRecord.set('color', String(args.color).trim())
        }
        if (args.criteria !== undefined && typeof args.criteria === 'object') {
          sfRecord.set('criteria', JSON.stringify(args.criteria))
        }
        if (args.pinned !== undefined) {
          sfRecord.set('pinned', args.pinned === true)
        }
        $app.save(sfRecord)

        return toolOk(
          {
            id: sfRecord.id,
            name: sfRecord.getString('name'),
            color: sfRecord.getString('color'),
            pinned: sfRecord.getBool('pinned'),
          },
          'Filtro salvo "' + sfRecord.getString('name') + '" atualizado com sucesso.',
        )
      }

      // 5. PIN / UNPIN
      if (action === 'pin' || action === 'unpin') {
        const nextPinned = action === 'pin'
        sfRecord.set('pinned', nextPinned)
        $app.save(sfRecord)
        return toolOk(
          { id: sfRecord.id, name: sfRecord.getString('name'), pinned: nextPinned },
          'Filtro salvo "' +
            sfRecord.getString('name') +
            '" ' +
            (nextPinned
              ? 'fixado nos Favoritos da barra lateral.'
              : 'desafixado da barra lateral.'),
        )
      }

      // 6. DELETE
      if (action === 'delete') {
        const sfName = sfRecord.getString('name')
        $app.delete(sfRecord)
        return toolOk(
          { deleted: true, id: sfId, name: sfName },
          'Filtro salvo "' + sfName + '" excluído com sucesso.',
        )
      }

      return toolFail('Ação desconhecida para manage_saved_filters: "' + action + '".')
    }

    // FERRAMENTA EXISTENTE 1: create_task (ampliada com description e section)
    if (toolName === 'create_task') {
      const title = String(args.title || '').trim()
      if (!title) {
        return toolFail('O parâmetro "title" é obrigatório.')
      }

      const description =
        args.description !== undefined ? String(args.description).slice(0, 5000) : ''

      // Resolver lista por id ou nome se fornecido
      let listId = ''
      let resolvedProjRec = null
      if (args.list && String(args.list).trim()) {
        const listArg = String(args.list).trim()
        try {
          const byId = $app.findFirstRecordByData('lists', 'id', listArg)
          if (byId && byId.getString('user') === userId) {
            resolvedProjRec = byId
            listId = byId.id
          }
        } catch (_) {}

        if (!listId) {
          const filter = "user = '" + userId + "' && name = '" + listArg.replace(/'/g, "\\'") + "'"
          const foundLists = $app.findRecordsByFilter('lists', filter, '', 1, 0)
          if (foundLists.length > 0) {
            resolvedProjRec = foundLists[0]
            listId = foundLists[0].id
          } else {
            // Cria novo projeto
            const listsCol = $app.findCollectionByNameOrId('lists')
            const newList = new Record(listsCol)
            newList.set('name', listArg)
            newList.set('user', userId)
            newList.set('order', 10)
            newList.set('pinned', false)
            newList.set('color', '#C5A880')
            $app.save(newList)
            resolvedProjRec = newList
            listId = newList.id
          }
        }
      }

      // Resolver section por id ou nome se fornecido
      let sectionId = ''
      if (args.section && String(args.section).trim() && listId) {
        const secArg = String(args.section).trim()
        try {
          const sById = $app.findFirstRecordByData('project_sections', 'id', secArg)
          if (
            sById &&
            sById.getString('user') === userId &&
            sById.getString('project') === listId
          ) {
            sectionId = sById.id
          }
        } catch (_) {}

        if (!sectionId) {
          const sFilter =
            "project = '" + listId + "' && name = '" + secArg.replace(/'/g, "\\'") + "'"
          const foundSecs = $app.findRecordsByFilter('project_sections', sFilter, '', 1, 0)
          if (foundSecs.length > 0) {
            sectionId = foundSecs[0].id
          } else {
            // Cria nova seção no projeto
            const sectionsCol = $app.findCollectionByNameOrId('project_sections')
            const newSec = new Record(sectionsCol)
            newSec.set('name', secArg)
            newSec.set('project', listId)
            newSec.set('user', userId)
            newSec.set('order', 10)
            $app.save(newSec)
            sectionId = newSec.id
          }
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
      if (description) taskRecord.set('description', description)
      if (listId) taskRecord.set('list', listId)
      if (sectionId) taskRecord.set('section', sectionId)
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
        description: taskRecord.getString('description') || null,
        due_date: taskRecord.getString('due_date'),
        due_time: taskRecord.getString('due_time'),
        priority: taskRecord.getInt('priority'),
        estimated_minutes: taskRecord.getInt('estimated_minutes'),
        done: false,
        list_id: listId || null,
        section_id: sectionId || null,
        tags: tagIds,
        created: taskRecord.getString('created'),
      }

      return toolOk(
        resultPayload,
        'Tarefa criada com sucesso: "' + title + '" (ID: ' + taskRecord.id + ')',
      )
    }

    // FERRAMENTA EXISTENTE 2: list_tasks (ampliada com overdue, priority, section)
    if (toolName === 'list_tasks') {
      const limit = args.limit ? Math.min(100, Math.max(1, Number(args.limit))) : 50
      let filters = ["user = '" + userId + "'"]

      // done filter: se explicitamente true ou false; se omitido, default é false
      if (args.done !== undefined && args.done !== null) {
        filters.push('done = ' + (args.done ? 'true' : 'false'))
      } else {
        filters.push('done = false')
      }

      const now = new Date()
      const todayStr = formatIsoDate(now)

      // Filtro por tarefas atrasadas
      if (args.overdue === true) {
        filters.push(
          "(due_date != '' && due_date != null && due_date < '" + todayStr + " 00:00:00.000Z')",
        )
      }

      // Filtro por prioridade específica (1..4)
      if (args.priority !== undefined && args.priority !== null) {
        const pNum = Number(args.priority)
        if (pNum >= 1 && pNum <= 4) {
          filters.push('priority = ' + pNum)
        }
      }

      // Filtro por data específica
      if (args.date) {
        const dStr = String(args.date).trim().slice(0, 10)
        filters.push("due_date ~ '" + dStr + "'")
      }

      // Filtro por visão temporal
      if (args.view) {
        const view = String(args.view).toLowerCase().trim()

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

      // Filtro por projeto (nome ou id)
      if (args.list) {
        const listArg = String(args.list).trim()
        let resolvedLId = ''
        try {
          const lRec = $app.findFirstRecordByData('lists', 'id', listArg)
          if (lRec && lRec.getString('user') === userId) resolvedLId = lRec.id
        } catch (_) {}

        if (!resolvedLId) {
          const foundLists = $app.findRecordsByFilter(
            'lists',
            "user = '" + userId + "' && name = '" + listArg.replace(/'/g, "\\'") + "'",
            '',
            1,
            0,
          )
          if (foundLists.length > 0) resolvedLId = foundLists[0].id
        }

        if (resolvedLId) {
          filters.push("list = '" + resolvedLId + "'")
        } else {
          return toolOk(
            { total: 0, tasks: [] },
            'Nenhuma tarefa encontrada para a lista/projeto "' + listArg + '".',
          )
        }
      }

      // Filtro por seção (nome ou id)
      if (args.section) {
        const secArg = String(args.section).trim()
        let resolvedSId = ''
        try {
          const sRec = $app.findFirstRecordByData('project_sections', 'id', secArg)
          if (sRec && sRec.getString('user') === userId) resolvedSId = sRec.id
        } catch (_) {}

        if (!resolvedSId) {
          const foundSecs = $app.findRecordsByFilter(
            'project_sections',
            "user = '" + userId + "' && name = '" + secArg.replace(/'/g, "\\'") + "'",
            '',
            1,
            0,
          )
          if (foundSecs.length > 0) resolvedSId = foundSecs[0].id
        }

        if (resolvedSId) {
          filters.push("section = '" + resolvedSId + "'")
        } else {
          return toolOk(
            { total: 0, tasks: [] },
            'Nenhuma tarefa encontrada para a seção "' + secArg + '".',
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

      const userSections = $app.findRecordsByFilter(
        'project_sections',
        "user = '" + userId + "'",
        '',
        200,
        0,
      )
      const sectionMap = {}
      for (let s = 0; s < userSections.length; s++) {
        sectionMap[userSections[s].id] = userSections[s].getString('name')
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
        const secId = t.getString('section')
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
          description: t.getString('description') || null,
          due_date: t.getString('due_date'),
          due_time: t.getString('due_time'),
          priority: t.getInt('priority') || 0,
          done: t.getBool('done'),
          estimated_minutes: t.getInt('estimated_minutes'),
          actual_minutes: t.getInt('actual_minutes'),
          list: lId && listMap[lId] ? listMap[lId] : null,
          section: secId && sectionMap[secId] ? sectionMap[secId] : null,
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
                    (t.list ? ' #' + t.list : '') +
                    (t.section ? ' / ' + t.section : '') +
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

    // FERRAMENTA EXISTENTE 4: update_task (ampliada com description e section)
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

      if (args.description !== undefined) {
        taskRecord.set('description', String(args.description).slice(0, 5000))
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

      // Lista/Projeto
      let currentOrNewListId = taskRecord.getString('list')
      if (args.list !== undefined) {
        const listArg = String(args.list).trim()
        if (listArg === '') {
          taskRecord.set('list', '')
          currentOrNewListId = ''
          taskRecord.set('section', '')
        } else {
          let resolvedLId = ''
          try {
            const lRec = $app.findFirstRecordByData('lists', 'id', listArg)
            if (lRec && lRec.getString('user') === userId) resolvedLId = lRec.id
          } catch (_) {}

          if (!resolvedLId) {
            const filter =
              "user = '" + userId + "' && name = '" + listArg.replace(/'/g, "\\'") + "'"
            const foundLists = $app.findRecordsByFilter('lists', filter, '', 1, 0)
            if (foundLists.length > 0) {
              resolvedLId = foundLists[0].id
            } else {
              const listsCol = $app.findCollectionByNameOrId('lists')
              const newList = new Record(listsCol)
              newList.set('name', listArg)
              newList.set('user', userId)
              newList.set('order', 10)
              newList.set('pinned', false)
              newList.set('color', '#C5A880')
              $app.save(newList)
              resolvedLId = newList.id
            }
          }
          taskRecord.set('list', resolvedLId)
          currentOrNewListId = resolvedLId
        }
      }

      // Seção do projeto
      if (args.section !== undefined) {
        const secArg = String(args.section).trim()
        if (secArg === '' || !currentOrNewListId) {
          taskRecord.set('section', '')
        } else {
          let resolvedSId = ''
          try {
            const sRec = $app.findFirstRecordByData('project_sections', 'id', secArg)
            if (
              sRec &&
              sRec.getString('user') === userId &&
              sRec.getString('project') === currentOrNewListId
            ) {
              resolvedSId = sRec.id
            }
          } catch (_) {}

          if (!resolvedSId) {
            const sFilter =
              "project = '" +
              currentOrNewListId +
              "' && name = '" +
              secArg.replace(/'/g, "\\'") +
              "'"
            const foundSecs = $app.findRecordsByFilter('project_sections', sFilter, '', 1, 0)
            if (foundSecs.length > 0) {
              resolvedSId = foundSecs[0].id
            } else {
              const sectionsCol = $app.findCollectionByNameOrId('project_sections')
              const newSec = new Record(sectionsCol)
              newSec.set('name', secArg)
              newSec.set('project', currentOrNewListId)
              newSec.set('user', userId)
              newSec.set('order', 10)
              $app.save(newSec)
              resolvedSId = newSec.id
            }
          }
          taskRecord.set('section', resolvedSId)
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
          description: taskRecord.getString('description') || null,
          due_date: taskRecord.getString('due_date'),
          due_time: taskRecord.getString('due_time'),
          priority: taskRecord.getInt('priority'),
          estimated_minutes: taskRecord.getInt('estimated_minutes'),
          done: taskRecord.getBool('done'),
          list_id: taskRecord.getString('list') || null,
          section_id: taskRecord.getString('section') || null,
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

    // FERRAMENTA EXISTENTE 6: get_focus_summary & get_focus_stats
    if (toolName === 'get_focus_summary' || toolName === 'get_focus_stats') {
      const period = String(args.period || (toolName === 'get_focus_stats' ? 'semana' : 'hoje'))
        .toLowerCase()
        .trim()
      const includeBreakdown = toolName === 'get_focus_stats' || args.include_breakdown === true
      const now = new Date()
      const todayStr = formatIsoDate(now)

      // Carregar sessões do usuário
      const sessions = $app.findRecordsByFilter(
        'sessions',
        "user = '" + userId + "'",
        '-session_date',
        1000,
        0,
      )

      // Carregar tarefas do usuário para cruzar títulos nos donuts
      const userTasks = $app.findRecordsByFilter('tasks', "user = '" + userId + "'", '', 1000, 0)
      const taskMap = {}
      for (let t = 0; t < userTasks.length; t++) {
        taskMap[userTasks[t].id] = userTasks[t].getString('title')
      }

      let totalMinutes = 0
      let sessionsCount = 0
      let completedCount = 0
      let batidoCount = 0
      let verdictCount = 0
      const taskMinutesMap = {}

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

      // Função para testar pertencimento ao período
      const isSessionInPeriod = function (sessionDateStr) {
        if (!sessionDateStr) return false
        const dIso = sessionDateStr.slice(0, 10)
        if (period === 'hoje') return dIso === todayStr
        if (period === 'semana') {
          const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
          const minIso = formatIsoDate(sevenDaysAgo)
          return dIso >= minIso && dIso <= todayStr
        }
        if (period === '30dias') {
          const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
          const minIso = formatIsoDate(thirtyDaysAgo)
          return dIso >= minIso && dIso <= todayStr
        }
        return true // 'todos'
      }

      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i]
        const dStr = (s.getString('session_date') || s.getString('started_at') || '').slice(0, 10)
        if (!isSessionInPeriod(dStr)) continue

        const dur = s.getInt('duration_minutes') || 0
        const status = s.getString('status') || 'completa'
        const outcome = s.getString('outcome_status')
        const tId = s.getString('task') || 'free'
        const tTitle = tId === 'free' ? 'Foco Livre' : taskMap[tId] || 'Tarefa #' + tId

        totalMinutes += dur
        sessionsCount++
        if (status === 'completa') completedCount++

        if (outcome) {
          verdictCount++
          if (outcome === 'batido') batidoCount++
        }

        if (!taskMinutesMap[tId]) {
          taskMinutesMap[tId] = {
            task_id: tId === 'free' ? null : tId,
            task_title: tTitle,
            total_minutes: 0,
            sessions_count: 0,
          }
        }
        taskMinutesMap[tId].totalMinutes += dur
        taskMinutesMap[tId].sessions_count += 1
      }

      // Ordena top tarefas por tempo
      const taskSlices = Object.keys(taskMinutesMap)
        .map(function (k) {
          return taskMinutesMap[k]
        })
        .sort(function (a, b) {
          return b.total_minutes - a.total_minutes
        })

      for (let m = 0; m < taskSlices.length; m++) {
        const slice = taskSlices[m]
        slice.percentage =
          totalMinutes > 0 ? Math.round((slice.total_minutes / totalMinutes) * 1000) / 10 : 0
      }

      const completionRate =
        sessionsCount > 0 ? Math.round((completedCount / sessionsCount) * 100) : 0
      const verdictSuccessRate =
        verdictCount > 0 ? Math.round((batidoCount / verdictCount) * 100) : null

      const summaryPayload = {
        period: period,
        total_minutes: totalMinutes,
        sessions_count: sessionsCount,
        completed_sessions_count: completedCount,
        completion_rate_percent: completionRate,
        verdict_total_evaluated: verdictCount,
        verdict_success_rate_percent: verdictSuccessRate,
        today_minutes: dayMap[todayStr] ? dayMap[todayStr].totalMinutes : 0,
        best_day: bestDay,
        is_today_record:
          bestDay !== null &&
          dayMap[todayStr] &&
          dayMap[todayStr].totalMinutes >= bestDay.total_minutes &&
          dayMap[todayStr].totalMinutes > 0,
      }

      if (includeBreakdown) {
        summaryPayload.top_tasks = taskSlices.slice(0, 10)
        summaryPayload.tasks_breakdown = taskSlices
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
        sessionsCount +
        ' (taxa de conclusão: ' +
        completionRate +
        '%)'

      if (verdictCount > 0) {
        textOutput +=
          '\n- Objetivos batidos: ' +
          batidoCount +
          ' de ' +
          verdictCount +
          ' avaliados (' +
          verdictSuccessRate +
          '%)'
      }

      if (bestDay && period === 'todos') {
        textOutput +=
          '\n- Recorde absoluto (Melhor Dia): ' +
          bestDay.total_minutes +
          ' min em ' +
          bestDay.date +
          ' (' +
          bestDay.sessions_count +
          ' sessões)'
      }

      if (includeBreakdown && taskSlices.length > 0) {
        textOutput +=
          '\nTop tarefas por tempo focado:\n' +
          taskSlices
            .slice(0, 5)
            .map(function (s) {
              return (
                '  * ' +
                s.task_title +
                ': ' +
                s.total_minutes +
                'm (' +
                s.percentage +
                '%, ' +
                s.sessions_count +
                ' sessões)'
              )
            })
            .join('\n')
      }

      return toolOk(summaryPayload, textOutput)
    }

    // FERRAMENTA EXISTENTE 7: log_focus_session (ampliada com objective e outcome_status)
    if (toolName === 'log_focus_session') {
      const dur = Number(args.duration_minutes)
      if (!dur || dur <= 0) {
        return toolFail('O parâmetro "duration_minutes" é obrigatório e deve ser maior que 0.')
      }

      const note = args.note ? String(args.note).slice(0, 500) : ''
      const objective = args.objective ? String(args.objective).slice(0, 300) : ''
      let outcomeStatus = null
      if (args.outcome_status) {
        const os = String(args.outcome_status).toLowerCase().trim()
        if (os === 'batido' || os === 'parcial' || os === 'nao_foi') {
          outcomeStatus = os
        } else {
          return toolFail(
            'outcome_status inválido. Valores aceitos: "batido", "parcial", "nao_foi".',
          )
        }
      }

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
      if (objective) sessRecord.set('objective', objective)
      if (outcomeStatus) sessRecord.set('outcome_status', outcomeStatus)

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
        objective: objective || null,
        outcome_status: outcomeStatus || null,
      }

      const verText = outcomeStatus ? ' | Veredito: [' + outcomeStatus + ']' : ''
      const objText = objective ? ' | Objetivo: "' + objective + '"' : ''

      return toolOk(
        resultSess,
        'Sessão de foco registrada com sucesso (' +
          dur +
          ' minutos em "' +
          taskTitle +
          '")' +
          objText +
          verText +
          '. ID: ' +
          sessRecord.id,
      )
    }

    return toolFail('Ferramenta desconhecida: "' + toolName + '"')
  }

  // Método não suportado
  if (isNotification) return e.noContent(202)
  return e.json(400, makeError(-32601, 'Method not found: ' + method))
})

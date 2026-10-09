// pocketbase/hooks/mcp_tokens.js
// Rota de criação segura de tokens MCP pelo usuário autenticado.
// Gera valor cru `bs_mcp_<36 chars>` devolvido apenas uma vez, salvando apenas o SHA-256 no banco.

routerAdd(
  'POST',
  '/backend/v1/mcp-tokens',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { error: 'Não autenticado' })
    }

    let body = {}
    try {
      const raw = toString(e.request.body)
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw)
      }
    } catch (err) {
      return e.json(400, { error: 'JSON inválido' })
    }

    const name = String(body.name || '').trim()
    if (!name) {
      return e.json(400, { error: 'O nome do token é obrigatório' })
    }
    if (name.length > 100) {
      return e.json(400, { error: 'O nome deve ter no máximo 100 caracteres' })
    }

    // Gera token aleatório de alta entropia: bs_mcp_ + 36 caracteres aleatórios
    const randomPart = $security.randomString(36)
    const rawToken = 'bs_mcp_' + randomPart
    const tokenHash = $security.sha256(rawToken)

    const col = $app.findCollectionByNameOrId('mcp_tokens')
    const record = new Record(col)
    record.set('name', name)
    record.set('user', authRecord.id)
    record.set('token_hash', tokenHash)
    record.set('revoked', false)

    $app.save(record)

    return e.json(201, {
      id: record.id,
      name: record.getString('name'),
      user: record.getString('user'),
      raw_token: rawToken,
      created: record.getString('created'),
      revoked: false,
      message: 'Token gerado com sucesso. Guarde este valor, ele não será exibido novamente.',
    })
  },
  $apis.requireAuth(),
)

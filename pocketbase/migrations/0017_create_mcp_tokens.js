migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && user.id = @request.auth.id"

    // createRule é null para desabilitar criação direta pelo cliente REST
    // Tokens só podem ser criados via endpoint do servidor (pb_hooks) para garantir hash SHA-256
    const mcpTokens = new Collection({
      name: 'mcp_tokens',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: null,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        { name: 'name', type: 'text', required: true, max: 100 },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'token_hash', type: 'text', required: true, max: 128 },
        { name: 'last_used_at', type: 'date', required: false },
        { name: 'revoked', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mcp_tokens_hash ON mcp_tokens (token_hash)',
        'CREATE INDEX idx_mcp_tokens_user ON mcp_tokens (user)',
      ],
    })

    app.save(mcpTokens)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('mcp_tokens')
      app.delete(col)
    } catch (_) {}
  },
)

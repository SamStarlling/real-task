migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && user.id = @request.auth.id"

    const presets = new Collection({
      name: 'focus_presets',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: ownerRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        { name: 'name', type: 'text', required: true, max: 60 },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'work_minutes', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'short_break_minutes', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'long_break_minutes', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'blocks_before_long_break', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'archived', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_focus_presets_user ON focus_presets (user)',
        'CREATE INDEX idx_focus_presets_user_archived ON focus_presets (user, archived)',
      ],
    })
    app.save(presets)

    // Seed idempotente: para cada usuário existente, se ele não possuir nenhum preset, cria o preset padrão "Foco" (25/5/15/4)
    const users = app.findRecordsByFilter(usersId, '', '', 0, 0)
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const existing = app.findRecordsByFilter('focus_presets', `user = '${user.id}'`, '', 1, 0)
      if (existing.length === 0) {
        const defaultPreset = new Record(presets)
        defaultPreset.set('name', 'Foco')
        defaultPreset.set('user', user.id)
        defaultPreset.set('work_minutes', 25)
        defaultPreset.set('short_break_minutes', 5)
        defaultPreset.set('long_break_minutes', 15)
        defaultPreset.set('blocks_before_long_break', 4)
        defaultPreset.set('archived', false)
        app.save(defaultPreset)
      }
    }
  },
  (app) => {
    try {
      const presets = app.findCollectionByNameOrId('focus_presets')
      app.delete(presets)
    } catch (_) {}
  },
)

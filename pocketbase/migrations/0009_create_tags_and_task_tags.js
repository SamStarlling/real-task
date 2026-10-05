migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && user.id = @request.auth.id"

    // 1. Criar a coleção tags
    const tags = new Collection({
      name: 'tags',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: ownerRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        { name: 'name', type: 'text', required: true, max: 30 },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'color', type: 'text', required: true, max: 20 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_tags_user_name ON tags (user, name)',
        'CREATE INDEX idx_tags_user ON tags (user)',
      ],
    })
    app.save(tags)

    // 2. Adicionar campo tags (relação múltipla com tags) na coleção tasks
    const tasks = app.findCollectionByNameOrId('tasks')
    if (!tasks.fields.getByName('tags')) {
      tasks.fields.add(
        new RelationField({
          name: 'tags',
          collectionId: tags.id,
          maxSelect: 20,
          cascadeDelete: false,
        }),
      )
      app.save(tasks)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      if (tasks.fields.getByName('tags')) {
        tasks.fields.removeByName('tags')
        app.save(tasks)
      }
    } catch (_) {}

    try {
      const tags = app.findCollectionByNameOrId('tags')
      app.delete(tags)
    } catch (_) {}
  },
)

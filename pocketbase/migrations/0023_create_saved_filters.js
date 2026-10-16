migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && user.id = @request.auth.id"

    let savedFilters
    try {
      savedFilters = app.findCollectionByNameOrId('saved_filters')
    } catch (_) {
      savedFilters = new Collection({
        name: 'saved_filters',
        type: 'base',
        listRule: ownerRule,
        viewRule: ownerRule,
        createRule: "@request.auth.id != ''",
        updateRule: ownerRule,
        deleteRule: ownerRule,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            max: 100,
          },
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'color',
            type: 'text',
            required: false,
            max: 30,
          },
          {
            name: 'criteria',
            type: 'json',
            required: false,
          },
          {
            name: 'pinned',
            type: 'bool',
            required: false,
          },
          {
            name: 'order',
            type: 'number',
            required: false,
            min: 0,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_saved_filters_user ON saved_filters (user)',
          'CREATE INDEX idx_saved_filters_user_pinned ON saved_filters (user, pinned)',
        ],
      })
      app.save(savedFilters)
    }
  },
  (app) => {
    try {
      const savedFilters = app.findCollectionByNameOrId('saved_filters')
      app.delete(savedFilters)
    } catch (_) {}
  },
)

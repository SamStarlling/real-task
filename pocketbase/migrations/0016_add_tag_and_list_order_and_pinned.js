migrate(
  (app) => {
    // 1. Atualizar coleção tags com order (number) e pinned (bool)
    const tags = app.findCollectionByNameOrId('tags')
    if (!tags.fields.getByName('order')) {
      tags.fields.add(
        new NumberField({
          name: 'order',
          required: false,
          min: 0,
        }),
      )
    }
    if (!tags.fields.getByName('pinned')) {
      // BoolField não deve ser required para permitir false
      tags.fields.add(
        new BoolField({
          name: 'pinned',
          required: false,
        }),
      )
    }
    tags.addIndex('idx_tags_user_pinned_order', false, 'user, pinned, order', '')
    app.save(tags)

    // Inicializar order das tags existentes por ordem de criação
    try {
      const tagRecords = app.findRecordsByFilter(
        'tags',
        'order = null || order = 0',
        'created',
        0,
        0,
      )
      for (let i = 0; i < tagRecords.length; i++) {
        tagRecords[i].set('order', (i + 1) * 10)
        if (tagRecords[i].get('pinned') === null || tagRecords[i].get('pinned') === undefined) {
          tagRecords[i].set('pinned', false)
        }
        app.save(tagRecords[i])
      }
    } catch (_) {}

    // 2. Atualizar coleção lists com order (number) e pinned (bool)
    const lists = app.findCollectionByNameOrId('lists')
    if (!lists.fields.getByName('order')) {
      lists.fields.add(
        new NumberField({
          name: 'order',
          required: false,
          min: 0,
        }),
      )
    }
    if (!lists.fields.getByName('pinned')) {
      lists.fields.add(
        new BoolField({
          name: 'pinned',
          required: false,
        }),
      )
    }
    lists.addIndex('idx_lists_user_pinned_order', false, 'user, pinned, order', '')
    app.save(lists)

    // Inicializar order das lists existentes por ordem de criação
    try {
      const listRecords = app.findRecordsByFilter(
        'lists',
        'order = null || order = 0',
        'created',
        0,
        0,
      )
      for (let i = 0; i < listRecords.length; i++) {
        listRecords[i].set('order', (i + 1) * 10)
        if (listRecords[i].get('pinned') === null || listRecords[i].get('pinned') === undefined) {
          listRecords[i].set('pinned', false)
        }
        app.save(listRecords[i])
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const tags = app.findCollectionByNameOrId('tags')
      tags.removeIndex('idx_tags_user_pinned_order')
      if (tags.fields.getByName('order')) tags.fields.removeByName('order')
      if (tags.fields.getByName('pinned')) tags.fields.removeByName('pinned')
      app.save(tags)
    } catch (_) {}

    try {
      const lists = app.findCollectionByNameOrId('lists')
      lists.removeIndex('idx_lists_user_pinned_order')
      if (lists.fields.getByName('order')) lists.fields.removeByName('order')
      if (lists.fields.getByName('pinned')) lists.fields.removeByName('pinned')
      app.save(lists)
    } catch (_) {}
  },
)

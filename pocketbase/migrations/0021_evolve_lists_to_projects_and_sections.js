migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && user.id = @request.auth.id"

    // 1. Evoluir coleção 'lists' (Projetos)
    const lists = app.findCollectionByNameOrId('lists')

    // color (text, default champagne #C5A880)
    if (!lists.fields.getByName('color')) {
      lists.fields.add(
        new TextField({
          name: 'color',
          required: false,
          max: 30,
        }),
      )
    }

    // goal (text, objetivo mensurável)
    if (!lists.fields.getByName('goal')) {
      lists.fields.add(
        new TextField({
          name: 'goal',
          required: false,
          max: 300,
        }),
      )
    }

    // description (text, obsidian link ou notas)
    if (!lists.fields.getByName('description')) {
      lists.fields.add(
        new TextField({
          name: 'description',
          required: false,
          max: 2000,
        }),
      )
    }

    // favorite (bool, default false - NÃO required)
    if (!lists.fields.getByName('favorite')) {
      lists.fields.add(
        new BoolField({
          name: 'favorite',
          required: false,
        }),
      )
    }

    // archived (bool, default false - NÃO required)
    if (!lists.fields.getByName('archived')) {
      lists.fields.add(
        new BoolField({
          name: 'archived',
          required: false,
        }),
      )
    }

    // parent (relation -> lists, auto-relação para sub-projetos)
    if (!lists.fields.getByName('parent')) {
      lists.fields.add(
        new RelationField({
          name: 'parent',
          collectionId: lists.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    lists.addIndex('idx_lists_user_archived', false, 'user, archived', '')
    lists.addIndex('idx_lists_user_favorite', false, 'user, favorite', '')
    lists.addIndex('idx_lists_parent', false, 'parent', '')

    app.save(lists)

    // Backfill defensivo de listas existentes se houver
    try {
      const existingLists = app.findRecordsByFilter('lists', '', 'created', 0, 0)
      for (let i = 0; i < existingLists.length; i++) {
        const item = existingLists[i]
        let changed = false
        if (!item.getString('color')) {
          item.set('color', '#C5A880')
          changed = true
        }
        if (item.get('favorite') === null || item.get('favorite') === undefined) {
          item.set('favorite', false)
          changed = true
        }
        if (item.get('archived') === null || item.get('archived') === undefined) {
          item.set('archived', false)
          changed = true
        }
        if (changed) {
          app.save(item)
        }
      }
    } catch (_) {}

    // 2. Criar coleção 'project_sections' (Seções de Projeto)
    let projectSections
    try {
      projectSections = app.findCollectionByNameOrId('project_sections')
    } catch (_) {
      projectSections = new Collection({
        name: 'project_sections',
        type: 'base',
        listRule: ownerRule,
        viewRule: ownerRule,
        createRule: ownerRule,
        updateRule: ownerRule,
        deleteRule: ownerRule,
        fields: [
          { name: 'name', type: 'text', required: true, max: 80 },
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'project',
            type: 'relation',
            required: true,
            collectionId: lists.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'order', type: 'number', required: false, min: 0 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_sections_project_order ON project_sections (project, order)',
          'CREATE INDEX idx_sections_user ON project_sections (user)',
        ],
      })
      app.save(projectSections)
    }

    // 3. Adicionar campo 'section' na coleção 'tasks'
    const tasks = app.findCollectionByNameOrId('tasks')
    if (!tasks.fields.getByName('section')) {
      tasks.fields.add(
        new RelationField({
          name: 'section',
          collectionId: projectSections.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
      tasks.addIndex('idx_tasks_section', false, 'section', '')
      app.save(tasks)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      tasks.removeIndex('idx_tasks_section')
      if (tasks.fields.getByName('section')) {
        tasks.fields.removeByName('section')
        app.save(tasks)
      }
    } catch (_) {}

    try {
      const projectSections = app.findCollectionByNameOrId('project_sections')
      app.delete(projectSections)
    } catch (_) {}

    try {
      const lists = app.findCollectionByNameOrId('lists')
      lists.removeIndex('idx_lists_user_archived')
      lists.removeIndex('idx_lists_user_favorite')
      lists.removeIndex('idx_lists_parent')
      if (lists.fields.getByName('color')) lists.fields.removeByName('color')
      if (lists.fields.getByName('goal')) lists.fields.removeByName('goal')
      if (lists.fields.getByName('description')) lists.fields.removeByName('description')
      if (lists.fields.getByName('favorite')) lists.fields.removeByName('favorite')
      if (lists.fields.getByName('archived')) lists.fields.removeByName('archived')
      if (lists.fields.getByName('parent')) lists.fields.removeByName('parent')
      app.save(lists)
    } catch (_) {}
  },
)

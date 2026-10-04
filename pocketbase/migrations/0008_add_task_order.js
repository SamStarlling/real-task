migrate(
  (app) => {
    const tasks = app.findCollectionByNameOrId('tasks')
    if (!tasks.fields.getByName('order')) {
      tasks.fields.add(
        new NumberField({
          name: 'order',
          required: false,
          min: 0,
        }),
      )
      tasks.addIndex('idx_tasks_user_order', false, 'user, order', '')
      app.save(tasks)
    }

    // Inicializar tarefas existentes sem order com base no timestamp de criação
    try {
      const records = app.findRecordsByFilter('tasks', 'order = null || order = 0', 'created', 0, 0)
      for (let i = 0; i < records.length; i++) {
        records[i].set('order', (i + 1) * 10)
        app.save(records[i])
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      tasks.removeIndex('idx_tasks_user_order')
      const field = tasks.fields.getByName('order')
      if (field) {
        tasks.fields.removeByName('order')
        app.save(tasks)
      }
    } catch (_) {}
  },
)

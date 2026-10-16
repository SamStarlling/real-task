migrate(
  (app) => {
    const tasks = app.findCollectionByNameOrId('tasks')
    const field = tasks.fields.getByName('estimated_minutes')

    if (field) {
      // Garantir min 0 e max 600, permitindo 0 ou nulo para tarefas sem estimativa
      field.min = 0
      field.max = 600
      app.save(tasks)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      const field = tasks.fields.getByName('estimated_minutes')
      if (field) {
        field.min = 1
        field.max = 240
        app.save(tasks)
      }
    } catch (_) {}
  },
)

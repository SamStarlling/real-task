migrate(
  (app) => {
    const tasks = app.findCollectionByNameOrId('tasks')
    if (!tasks.fields.getByName('subtasks')) {
      tasks.fields.add(
        new JSONField({
          name: 'subtasks',
          required: false,
        }),
      )
      app.save(tasks)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      if (tasks.fields.getByName('subtasks')) {
        tasks.fields.removeByName('subtasks')
        app.save(tasks)
      }
    } catch (_) {}
  },
)

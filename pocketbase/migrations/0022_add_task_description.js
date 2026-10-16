migrate(
  (app) => {
    const tasks = app.findCollectionByNameOrId('tasks')

    if (!tasks.fields.getByName('description')) {
      tasks.fields.add(
        new TextField({
          name: 'description',
          required: false,
          max: 5000,
        }),
      )
      app.save(tasks)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      if (tasks.fields.getByName('description')) {
        tasks.fields.removeByName('description')
        app.save(tasks)
      }
    } catch (_) {}
  },
)

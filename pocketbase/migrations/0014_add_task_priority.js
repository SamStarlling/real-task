migrate(
  (app) => {
    const tasks = app.findCollectionByNameOrId('tasks')
    if (!tasks.fields.getByName('priority')) {
      tasks.fields.add(
        new NumberField({
          name: 'priority',
          required: false,
          min: 0,
          max: 4,
          onlyInt: true,
        }),
      )
      app.save(tasks)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      if (tasks.fields.getByName('priority')) {
        tasks.fields.removeByName('priority')
        app.save(tasks)
      }
    } catch (_) {}
  },
)

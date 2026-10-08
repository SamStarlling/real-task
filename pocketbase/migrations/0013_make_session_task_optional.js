migrate(
  (app) => {
    const sessions = app.findCollectionByNameOrId('sessions')
    const taskField = sessions.fields.getByName('task')
    if (taskField) {
      taskField.required = false
      app.save(sessions)
    }
  },
  (app) => {
    try {
      const sessions = app.findCollectionByNameOrId('sessions')
      const taskField = sessions.fields.getByName('task')
      if (taskField) {
        taskField.required = true
        app.save(sessions)
      }
    } catch (_) {}
  },
)

migrate(
  (app) => {
    // 1. Adicionar due_time na coleção tasks
    const tasks = app.findCollectionByNameOrId('tasks')
    if (!tasks.fields.getByName('due_time')) {
      tasks.fields.add(
        new TextField({
          name: 'due_time',
          required: false,
          max: 5,
        }),
      )
      app.save(tasks)
    }

    // 2. Adicionar notification_preferences na coleção users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('notification_preferences')) {
      users.fields.add(
        new JSONField({
          name: 'notification_preferences',
          required: false,
          maxSize: 2048,
        }),
      )
      app.save(users)
    }
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      if (tasks.fields.getByName('due_time')) {
        tasks.fields.removeByName('due_time')
        app.save(tasks)
      }
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      if (users.fields.getByName('notification_preferences')) {
        users.fields.removeByName('notification_preferences')
        app.save(users)
      }
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const sessions = app.findCollectionByNameOrId('sessions')
    if (!sessions.fields.getByName('note')) {
      sessions.fields.add(
        new TextField({
          name: 'note',
          required: false,
          max: 500,
        }),
      )
      app.save(sessions)
    }
  },
  (app) => {
    try {
      const sessions = app.findCollectionByNameOrId('sessions')
      const field = sessions.fields.getByName('note')
      if (field) {
        sessions.fields.removeByName('note')
        app.save(sessions)
      }
    } catch (_) {}
  },
)

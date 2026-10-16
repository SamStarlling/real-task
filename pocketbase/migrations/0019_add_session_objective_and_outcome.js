migrate(
  (app) => {
    const sessions = app.findCollectionByNameOrId('sessions')

    // 1. Campo objective (text, opcional, até 300 caracteres)
    if (!sessions.fields.getByName('objective')) {
      sessions.fields.add(
        new TextField({
          name: 'objective',
          required: false,
          max: 300,
        }),
      )
    }

    // 2. Campo outcome_status (select, opcional, valores: batido, parcial, nao_foi)
    if (!sessions.fields.getByName('outcome_status')) {
      sessions.fields.add(
        new SelectField({
          name: 'outcome_status',
          required: false,
          values: ['batido', 'parcial', 'nao_foi'],
          maxSelect: 1,
        }),
      )
    }

    app.save(sessions)
  },
  (app) => {
    try {
      const sessions = app.findCollectionByNameOrId('sessions')
      let changed = false
      if (sessions.fields.getByName('objective')) {
        sessions.fields.removeByName('objective')
        changed = true
      }
      if (sessions.fields.getByName('outcome_status')) {
        sessions.fields.removeByName('outcome_status')
        changed = true
      }
      if (changed) {
        app.save(sessions)
      }
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const tasks = app.findCollectionByNameOrId('tasks')

    if (!tasks.fields.getByName('recurrence_type')) {
      tasks.fields.add(
        new SelectField({
          name: 'recurrence_type',
          required: false,
          values: ['none', 'daily', 'weekly_days', 'weekly', 'monthly'],
          maxSelect: 1,
        }),
      )
    }

    if (!tasks.fields.getByName('recurrence_interval')) {
      tasks.fields.add(
        new NumberField({
          name: 'recurrence_interval',
          required: false,
          min: 1,
          onlyInt: true,
        }),
      )
    }

    if (!tasks.fields.getByName('recurrence_weekdays')) {
      tasks.fields.add(
        new JSONField({
          name: 'recurrence_weekdays',
          required: false,
        }),
      )
    }

    if (!tasks.fields.getByName('recurrence_mode')) {
      tasks.fields.add(
        new SelectField({
          name: 'recurrence_mode',
          required: false,
          values: ['from_date', 'from_completion'],
          maxSelect: 1,
        }),
      )
    }

    app.save(tasks)
  },
  (app) => {
    try {
      const tasks = app.findCollectionByNameOrId('tasks')
      let changed = false
      const fields = [
        'recurrence_type',
        'recurrence_interval',
        'recurrence_weekdays',
        'recurrence_mode',
      ]
      for (let i = 0; i < fields.length; i++) {
        if (tasks.fields.getByName(fields[i])) {
          tasks.fields.removeByName(fields[i])
          changed = true
        }
      }
      if (changed) {
        app.save(tasks)
      }
    } catch (_) {}
  },
)

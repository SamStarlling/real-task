migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('weekly_focus_goals')) {
      users.fields.add(
        new JSONField({
          name: 'weekly_focus_goals',
          required: false,
          maxSize: 2048,
        }),
      )
      app.save(users)
    }

    // Migrate existing users by creating JSON with their daily_focus_goal_minutes (or 120 fallback)
    const records = app.findRecordsByFilter('users', '1=1', '', 0, 0)
    for (const record of records) {
      const existing = record.get('weekly_focus_goals')
      if (!existing || Object.keys(existing).length === 0) {
        const val = record.getInt('daily_focus_goal_minutes') || 120
        record.set('weekly_focus_goals', {
          dom: val,
          seg: val,
          ter: val,
          qua: val,
          qui: val,
          sex: val,
          sab: val,
        })
        app.save(record)
      }
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = users.fields.getByName('weekly_focus_goals')
    if (field) {
      users.fields.removeByName('weekly_focus_goals')
      app.save(users)
    }
  },
)

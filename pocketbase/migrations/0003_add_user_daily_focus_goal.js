migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('daily_focus_goal_minutes')) {
      users.fields.add(
        new NumberField({
          name: 'daily_focus_goal_minutes',
          required: false,
          min: 15,
          max: 720,
          onlyInt: true,
        }),
      )
      app.save(users)
    }

    // Set default value 120 for existing users who don't have it set
    app
      .db()
      .newQuery(
        'UPDATE users SET daily_focus_goal_minutes = 120 WHERE daily_focus_goal_minutes IS NULL OR daily_focus_goal_minutes = 0',
      )
      .execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = users.fields.getByName('daily_focus_goal_minutes')
    if (field) {
      users.fields.removeByName('daily_focus_goal_minutes')
      app.save(users)
    }
  },
)

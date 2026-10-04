migrate(
  (app) => {
    // Populate weekly_focus_goals for all users using SQL with JSON string
    app
      .db()
      .newQuery(
        `UPDATE users
         SET weekly_focus_goals = json_object(
           'dom', COALESCE(daily_focus_goal_minutes, 120),
           'seg', COALESCE(daily_focus_goal_minutes, 120),
           'ter', COALESCE(daily_focus_goal_minutes, 120),
           'qua', COALESCE(daily_focus_goal_minutes, 120),
           'qui', COALESCE(daily_focus_goal_minutes, 120),
           'sex', COALESCE(daily_focus_goal_minutes, 120),
           'sab', COALESCE(daily_focus_goal_minutes, 120)
         )
         WHERE weekly_focus_goals IS NULL OR weekly_focus_goals = '' OR weekly_focus_goals = '{}'`,
      )
      .execute()
  },
  () => {},
)

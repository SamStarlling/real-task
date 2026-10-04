migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && user.id = @request.auth.id"

    const lists = new Collection({
      name: 'lists',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: ownerRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        { name: 'name', type: 'text', required: true, max: 40 },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_lists_user_name ON lists (user, name)',
        'CREATE INDEX idx_lists_user ON lists (user)',
      ],
    })
    app.save(lists)

    const tasks = new Collection({
      name: 'tasks',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: ownerRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'list',
          type: 'relation',
          collectionId: lists.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'due_date', type: 'date' },
        { name: 'done', type: 'bool' },
        { name: 'estimated_minutes', type: 'number', min: 5, max: 240, onlyInt: true },
        { name: 'actual_minutes', type: 'number', min: 0 },
        { name: 'completed_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tasks_user ON tasks (user)',
        'CREATE INDEX idx_tasks_due_date ON tasks (due_date)',
        'CREATE INDEX idx_tasks_done ON tasks (done)',
        'CREATE INDEX idx_tasks_user_done_due ON tasks (user, done, due_date)',
      ],
    })
    app.save(tasks)

    const sessions = new Collection({
      name: 'sessions',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: ownerRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: 'task',
          type: 'relation',
          required: true,
          collectionId: tasks.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'started_at', type: 'date', required: true },
        { name: 'ended_at', type: 'date', required: true },
        { name: 'duration_minutes', type: 'number', required: true, min: 0 },
        { name: 'session_date', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['completa', 'interrompida'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_sessions_user ON sessions (user)',
        'CREATE INDEX idx_sessions_task ON sessions (task)',
        'CREATE INDEX idx_sessions_date ON sessions (session_date)',
        'CREATE INDEX idx_sessions_user_date ON sessions (user, session_date)',
      ],
    })
    app.save(sessions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('sessions'))
    app.delete(app.findCollectionByNameOrId('tasks'))
    app.delete(app.findCollectionByNameOrId('lists'))
  },
)

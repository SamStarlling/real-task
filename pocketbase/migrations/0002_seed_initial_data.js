migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('users', 'samelabarbosa.06@gmail.com')
      return
    } catch (_) {}
    const record = new Record(app.findCollectionByNameOrId('users'))
    record.setEmail('samelabarbosa.06@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Samela Barbosa')
    app.save(record)
  },
  (app) => {
    try {
      app.delete(app.findAuthRecordByEmail('users', 'samelabarbosa.06@gmail.com'))
    } catch (_) {}
  },
)

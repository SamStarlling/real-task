migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'samelabarbosa.06@gmail.com')
      record.setPassword('Skip@Pass')
      app.save(record)
    } catch (_) {
      // Idempotente: se o usuário não for encontrado por email, tenta por ID antes de desistir sem falhar
      try {
        const recordById = app.findFirstRecordByData('users', 'id', 'yk285dirmab6ymw')
        recordById.setPassword('Skip@Pass')
        app.save(recordById)
      } catch (__) {}
    }
  },
  (app) => {
    // Reversão não é necessária / idempotente para reset de credenciais
  },
)

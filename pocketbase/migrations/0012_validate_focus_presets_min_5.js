migrate(
  (app) => {
    // 1. Atualizar registros existentes com valores < 5 para 5 min
    app
      .db()
      .newQuery(`
      UPDATE focus_presets
      SET work_minutes = 5
      WHERE work_minutes < 5
    `)
      .execute()

    app
      .db()
      .newQuery(`
      UPDATE focus_presets
      SET short_break_minutes = 5
      WHERE short_break_minutes < 5
    `)
      .execute()

    app
      .db()
      .newQuery(`
      UPDATE focus_presets
      SET long_break_minutes = 5
      WHERE long_break_minutes < 5
    `)
      .execute()

    app
      .db()
      .newQuery(`
      UPDATE focus_presets
      SET blocks_before_long_break = 1
      WHERE blocks_before_long_break < 1
    `)
      .execute()

    // 2. Atualizar constraints na coleção focus_presets
    const col = app.findCollectionByNameOrId('focus_presets')
    const workField = col.fields.getByName('work_minutes')
    if (workField) {
      workField.min = 5
    }
    const shortField = col.fields.getByName('short_break_minutes')
    if (shortField) {
      shortField.min = 5
    }
    const longField = col.fields.getByName('long_break_minutes')
    if (longField) {
      longField.min = 5
    }
    const blocksField = col.fields.getByName('blocks_before_long_break')
    if (blocksField) {
      blocksField.min = 1
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('focus_presets')
    const workField = col.fields.getByName('work_minutes')
    if (workField) {
      workField.min = 1
    }
    const shortField = col.fields.getByName('short_break_minutes')
    if (shortField) {
      shortField.min = 1
    }
    const longField = col.fields.getByName('long_break_minutes')
    if (longField) {
      longField.min = 1
    }
    const blocksField = col.fields.getByName('blocks_before_long_break')
    if (blocksField) {
      blocksField.min = 1
    }
    app.save(col)
  },
)

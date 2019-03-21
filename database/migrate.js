const Postgrator = require('postgrator')
const path = require('path')

const postgrator = new Postgrator({
  // Directory containing migration files
  migrationDirectory: path.join(__dirname, '/migrations'),
  driver: 'pg',
  // Database connection config
  username: process.env.POSTGRES_USR || 'solar',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES__DB || 'solar',
  password: process.env.POSTGRES_PWD || 'qwerty',
  port: process.env.POSTGRES_PORT || 5432,
  ssl: process.env.POSTGRES_SSL || false,

  // Schema table name. Optional. Default is schemaversion
  schemaTable: 'schemaversion'
})

postgrator.on('validation-started', migration => console.log(migration))
postgrator.on('validation-finished', migration => console.log(migration))
postgrator.on('migration-started', migration => console.log(migration))
postgrator.on('migration-finished', migration => console.log(migration))

// Migrate to max version (optionally can provide 'max')
postgrator
  .migrate()
  .then(appliedMigrations => {
    console.log(appliedMigrations)
    let handles = process._getActiveHandles()
    for (let i = 0; i < handles.length; i++) {
      if (handles[i]._host && handles[i]._host.indexOf('postgres')) {
        handles[i].end()
        console.log('Closed the postgres socket')
      }
    }
  })
  .catch(error => console.log(error))

const models = require('./model/index.ts');

// Ensure the database tables have been created, particularly the session storage.
models.sequelize.sync({}).then(
    () => console.log('Database tables successfully initialized'),
    err => {
        console.log(err);
        process.exit(1);
    },
);

const models = require('./model/index.js');

// Ensure the database tables have been created, particularly the session storage.
models.sequelize
    .sync({
        force: process.env.NODE_ENV === 'development',
    })
    .then(
        () => console.log('Database tables successfully initialized'),
        err => {
            console.log(err);
            process.exit(1);
        },
    );

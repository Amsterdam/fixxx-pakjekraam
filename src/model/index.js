// Copied from https://github.com/sequelize/express-example/
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const databaseURL = new URL(process.env.DATABASE_URL);
const config = {
    host: databaseURL.hostname,
    database: path.basename(databaseURL.pathname),
    username: databaseURL.username,
    password: databaseURL.password,
    dialect: 'postgres',
};

const db = {};

const sequelize = config.use_env_variable
    ? new Sequelize(process.env[config.use_env_variable], config)
    : new Sequelize(config.database, config.username, config.password, config);

fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf('.') !== 0 && file !== basename && file.slice(-'.js'.length) === '.js';
    })
    .forEach(file => {
        const model = sequelize.import(path.join(__dirname, file));

        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

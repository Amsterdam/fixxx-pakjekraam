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

export const sequelize = config.use_env_variable
    ? new Sequelize(process.env[config.use_env_variable], config)
    : new Sequelize(config.database, config.username, config.password, config);

export const allocation = sequelize.import(path.join(__dirname, 'allocation.sequelize.ts'));
export const rsvp = sequelize.import(path.join(__dirname, 'rsvp.sequelize.ts'));
export const plaatsvoorkeur = sequelize.import(path.join(__dirname, 'plaatsvoorkeur.sequelize.ts'));
export const session = sequelize.import(path.join(__dirname, 'session.sequelize.ts'));
export const voorkeur = sequelize.import(path.join(__dirname, 'voorkeur.sequelize.ts'));

export default {
    allocation,
    plaatsvoorkeur,
    rsvp,
    sequelize,
    Sequelize,
    session,
    voorkeur,
};

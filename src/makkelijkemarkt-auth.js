'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const packageJSON = require('../package.json');
const { login } = require('./makkelijkemarkt-api.js');

const MILLISECONDS_IN_SECOND = 1000;

const loginSettings = {
    url: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
};

passport.use(
    new LocalStrategy(
        {
            session: true,
        },
        function(username, password, cb) {
            login({
                ...loginSettings,
                username,
                password,
            }).then(
                session =>
                    cb(null, {
                        username,
                        token: session.uuid,
                        expiry: new Date(
                            Date.parse(session.creationDate) + MILLISECONDS_IN_SECOND * session.lifeTime,
                        ).toISOString(),
                    }),
                err => cb(null, false),
            );
        },
    ),
);

const sessions = {};

passport.serializeUser(function(user, cb) {
    // FIXME: Replace in-memory user storage with a sustainable solution
    sessions[user.username] = user;
    cb(null, user.username);
});

passport.deserializeUser(function(id, cb) {
    // FIXME: Replace in-memory user storage with a sustainable solution
    const user = sessions[id];

    if (user) {
        cb(null, user);
    } else {
        cb(new Error('User not found'));
    }
});

const requireAuthorization = passport.authenticate('local', { failureRedirect: '/login.html', session: true });

module.exports = {
    requireAuthorization,
};

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const packageJSON = require('../package.json');
const { init, login } = require('./makkelijkemarkt-api.js');

const MILLISECONDS_IN_SECOND = 1000;

const loginSettings = {
    url: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
};

init(loginSettings);

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

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(user, cb) {
    cb(null, user);
});

const requireAuthorization = passport.authenticate('local', { failureRedirect: '/login', session: true });

module.exports = {
    requireAuthorization,
};

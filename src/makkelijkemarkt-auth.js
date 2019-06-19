const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const packageJSON = require('../package.json');
const { init, login, getMarktondernemer } = require('./makkelijkemarkt-api.js');
const { isErkenningsnummer } = require('./domain-knowledge.js');

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
            const handleLogin = (session, extraData) =>
                cb(null, {
                    ...extraData,
                    username,
                    token: session.uuid,
                    expiry: new Date(
                        Date.parse(session.creationDate) + MILLISECONDS_IN_SECOND * session.lifeTime,
                    ).toISOString(),
                });

            const handleError = err => cb(null, false);

            if (isErkenningsnummer(username)) {
                login({
                    ...loginSettings,
                    username: process.env.API_READONLY_USER,
                    password: process.env.API_READONLY_PASS,
                })
                    .then(session =>
                        getMarktondernemer(session.uuid, username).then(
                            ondernemer => {
                                if (!ondernemer.pasUid) {
                                    // This method of authentication only works for people with a `pasUid`
                                    throw new Error('Incorrect username/password');
                                } else if (password !== ondernemer.pasUid) {
                                    throw new Error('Incorrect username/password');
                                } else {
                                    return session;
                                }
                            },
                            err => {
                                console.log(err);
                                throw new Error('Incorrect username/password');
                            },
                        ),
                    )
                    .then(session => {
                        handleLogin(session, {
                            userType: 'ondernemer',
                            erkenningsNummer: username,
                        });
                    }, handleError);

                return;
            }

            login({
                ...loginSettings,
                username,
                password,
            }).then(
                session =>
                    handleLogin(session, {
                        userType: 'admin',
                    }),
                handleError,
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

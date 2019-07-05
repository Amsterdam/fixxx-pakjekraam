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

const readOnlyLogin = () =>
    login({
        ...loginSettings,
        username: process.env.API_READONLY_USER,
        password: process.env.API_READONLY_PASS,
    }).then(session => ({
        token: session.uuid,
        expiry: new Date(Date.parse(session.creationDate) + MILLISECONDS_IN_SECOND * session.lifeTime).toISOString(),
    }));

const checkActivationCode = (username, code) =>
    readOnlyLogin().then(session =>
        getMarktondernemer(session.token, username).then(
            ondernemer => {
                if (!ondernemer.pasUid) {
                    // This method of activation only works for people with a `pasUid`
                    throw new Error('Incorrect username/password');
                } else {
                    return typeof code === 'string' && code.length > 0 && code === ondernemer.pasUid;
                }
            },
            err => {
                console.log(err);
                throw new Error('Incorrect username/password');
            },
        ),
    );

module.exports = {
    checkActivationCode,
    readOnlyLogin,
};

import { init, login, getMarktondernemer } from './makkelijkemarkt-api';
import { MMSession } from './makkelijkemarkt.model';
import { requireEnv } from './util';

const packageJSON = require('../package.json');
const MILLISECONDS_IN_SECOND = 1000;

requireEnv('API_URL');
requireEnv('API_MMAPPKEY');
requireEnv('API_READONLY_USER');
requireEnv('API_READONLY_PASS');

const loginSettings = {
    url: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
};

init(loginSettings);

export const readOnlyLogin = (): Promise<{ token: string; expiry: string }> =>
    login({
        ...loginSettings,
        username: process.env.API_READONLY_USER,
        password: process.env.API_READONLY_PASS,
    }).then((session: MMSession) => {
        console.log(session);
        return {
            token: session.uuid,
            expiry: new Date(
                new Date(session.creationDate).getTime() + MILLISECONDS_IN_SECOND * session.lifeTime,
            ).toISOString(),
        };
    });

export const checkActivationCode = (username: string, code: string): Promise<boolean> =>
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
            (err: Error) => {
                console.log(err);
                throw new Error('Incorrect username/password');
            },
        ),
    );

import { AxiosInstance, AxiosResponse } from 'axios';
// import AxiosLogger from 'axios-logger';
// import { setupCache } from 'axios-cache-adapter';
import { addDays, MONDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY, requireEnv } from './util';
import { MMMarkt, MMOndernemerStandalone, MMSollicitatieStandalone, MMOndernemer } from './makkelijkemarkt.model';
const packageJSON = require('../package.json');
const axios = require('axios');

import { session } from './model/index';
import { upsert } from './sequelize-util.js';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;

export let init = (config: { url: string; appKey: string }) => {};

requireEnv('API_URL');
requireEnv('API_MMAPPKEY');
requireEnv('API_READONLY_USER');
requireEnv('API_READONLY_PASS');

type ApiConfig = {
    baseUrl: string,
    appKey: string,
    loginUrl: string,
    username: string;
    password: string;
    clientApp: string;
    clientVersion: string;
    sessionKey: string;
    sessionLifetime: number;
};
type apiBaseReturn = {
    token: string;
    api: AxiosInstance;
};

const mmConfig = {
    baseUrl: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    loginUrl: 'login/basicUsername/',
    username: process.env.API_READONLY_USER,
    password: process.env.API_READONLY_PASS,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
    sessionKey: 'mmsession',
    sessionLifetime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * 6,
};

const apiBase = (config: ApiConfig): Promise<apiBaseReturn> => {
    const api = axios.create({
        baseURL: config.baseUrl,
        headers: {
            MmAppKey: config.appKey,
        },
    });

    return session.findByPk(config.sessionKey).then((sessionRecord: any) => {
            const now = new Date();
            const timePassed = sessionRecord ?
                new Date(sessionRecord.dataValues.expire).getTime() - now.getTime() :
                0;
            if (timePassed <= 0) {
                console.log('EXPIRED');

                return api.post(config.loginUrl, {
                    username: config.username,
                    password: config.password,
                    clientApp: config.clientApp,
                    clientVersion: config.clientVersion,
                }).then((response: any) => {
                    const expire = now.setTime(now.getTime() + config.sessionLifetime);

                    return upsert(session, {
                        sid: config.sessionKey,
                    }, {
                        sess: { 'token': response.data.uuid },
                        expire,
                    }).then(() => ({
                        token: response.data.uuid,
                        api,
                    }));
                }).then((data: apiBaseReturn) => data);
            }else {
                console.log('NOT EXPIRED');
                const token = sessionRecord.dataValues.sess.token;

                return {
                    token,
                    api,
                };
            }
    });

};

const makkelijkeMarktAPI: Promise<AxiosInstance> = new Promise(resolve => {
    // Overrides the noop `init` definition above with a function that can
    // resolve the promise we're currently in. This way, some auth parameters
    // required for all functions in here can be set externally and in here we can
    // simply call `makkelijkeMarktAPI` and be sure that when it's resolved, the
    // correct parameters have been set.
    //
    // FIXME: Hard to read.
    init = (config: { url: string; appKey: string }) => {
        const api = axios.create({
            baseURL: config.url,
            headers: {
                MmAppKey: config.appKey,
            },
            // adapter: process.env.NODE_ENV === 'development' ? cache.adapter : undefined,
        });

        // if (process.env.NODE_ENV === 'development') {
        // api.interceptors.request.use(AxiosLogger.requestLogger);
        // }
        resolve(api);
    };
});

type LoginArgs = {
    username: string;
    password: string;
    clientApp: string;
    clientVersion: string;
};

// FIXME: Use RxJS for these asynchronous dependencies
export const login = (data: LoginArgs) =>
    makkelijkeMarktAPI
        .then(api =>
            api.post('login/basicUsername/', {
                username: data.username,
                password: data.password,
                clientApp: data.clientApp,
                clientVersion: data.clientVersion,
            }),
        )
        .then(response => response.data);

export const getMarktondernemers = (token: string): Promise<MMSollicitatieStandalone[]> =>
    makkelijkeMarktAPI
        .then(api =>
            api.get<any, AxiosResponse<MMSollicitatieStandalone[]>>('koopman/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        )
        .then(response => response.data);

export const getMarktondernemer = (token: string, id: string): Promise<MMOndernemerStandalone> =>
    makkelijkeMarktAPI
        .then(api =>
            api.get<any, AxiosResponse<MMOndernemerStandalone>>(`koopman/erkenningsnummer/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        )
        .then(response => response.data);

export const getMarktondernemersByMarkt = (token: string, marktId: string): Promise<MMSollicitatieStandalone[]> => {
    return apiBase(mmConfig).then((data: { token: string; api: AxiosInstance }) =>
        data.api.get<any, AxiosResponse<MMSollicitatieStandalone[]>>(`lijst/week/${marktId}`, {
            headers: {
                Authorization: `Bearer ${data.token}`,
            },
        }),

    ).then((response: any) => response.data);
};

export const getMarkt = (token: string, marktId: string): Promise<MMMarkt> =>
    makkelijkeMarktAPI
        .then(api =>
            api.get(`markt/${marktId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        )
        .then(response => response.data);

export const getMarkten = (token: string): Promise<MMMarkt[]> =>
    makkelijkeMarktAPI
        .then(api =>
            api.get('markt/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        )
        .then(response => response.data);

const A_LIJST_DAYS = [FRIDAY, SATURDAY, SUNDAY];

export const getALijst = (token: string, marktId: string, marktDate: string): Promise<MMOndernemer[]> => {
    const day = new Date(marktDate).getDay();

    if (A_LIJST_DAYS.includes(day)) {
        const monday = addDays(marktDate, MONDAY - day),
            thursday = addDays(marktDate, THURSDAY - day);

        return makkelijkeMarktAPI
            .then(api =>
                api.get(`rapport/aanwezigheid/${marktId}/${monday}/${thursday}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            )
            .then(response => response.data);
    } else {
        return new Promise(resolve => resolve([]));
    }
};

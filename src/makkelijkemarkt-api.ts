import { AxiosInstance, AxiosResponse } from 'axios';
// import AxiosLogger from 'axios-logger';
// import { setupCache } from 'axios-cache-adapter';
import { addDays, MONDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY, requireEnv } from './util';
import {
    MMMarkt,
    MMOndernemerStandalone,
    MMSollicitatieStandalone,
    MMOndernemer,
    MMSession,
} from './makkelijkemarkt.model';

const packageJSON = require('../package.json');

requireEnv('API_URL');
requireEnv('API_MMAPPKEY');
requireEnv('API_READONLY_USER');
requireEnv('API_READONLY_PASS');

const axios = require('axios');

const MILLISECONDS_IN_SECOND = 1000;
// const SECONDS_IN_MINUTE = 60;
// const MINUTES_IN_HOUR = 60;
// const CACHE_MAXAGE = MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;

// const cache = setupCache({
//     maxAge: CACHE_MAXAGE,
// });

export let init = (config: { url: string; appKey: string }) => {};

const loginSettings = {
    url: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
};

const login2 = (data: LoginArgs) =>
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

const readOnlyLogin2 = (): Promise<{ token: string; expiry: string }> =>
    login2({
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

const makkelijkeMarktAPI: Promise<AxiosInstance> = new Promise(resolve => {
    // Overrides the noop `init` definition above with a function that can
    // resolve the promise we're currently in. This way, some auth parameters
    // required for all functions in here can be set externally and in here we can
    // simply call `makkelijkeMarktAPI` and be sure that when it's resolved, the
    // correct parameters have been set.
    //
    // FIXME: Hard to read.
    //login
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

const makkelijkeMarktLoginWrapperAPI: Promise<AxiosInstance> = () =>
    readOnlyLogin2().then(session => {
        console.log(session);
        return makkelijkeMarktAPI.then(api => {
            api.interceptors.request.use(config => {
                config.headers.get['Authorization'] = `Bearer ${session.token}`;
                return config;
            });
            return api;
        });
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

export const getMarktondernemersByMarkt = (token: string, marktId: string): Promise<MMSollicitatieStandalone[]> =>
    makkelijkeMarktAPI
        .then(api =>
            api.get<any, AxiosResponse<MMSollicitatieStandalone[]>>(`lijst/week/${marktId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        )
        .then(response => response.data);

export const getMarkt = (token: string, marktId: string): Promise<MMMarkt> =>
    makkelijkeMarktLoginWrapperAPI.then(api => api.get(`markt/${marktId}`)).then(response => response.data);

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

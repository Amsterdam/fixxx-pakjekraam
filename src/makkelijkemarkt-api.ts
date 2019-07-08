import { AxiosInstance, AxiosResponse } from 'axios';
// import AxiosLogger from 'axios-logger';
// import { setupCache } from 'axios-cache-adapter';
import { addDays, MONDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } from './util.js';
import { MMMarkt, MMOndernemerStandalone, MMSollicitatieStandalone } from './makkelijkemarkt.model';

const axios = require('axios');

// const MILLISECONDS_IN_SECOND = 1000;
// const SECONDS_IN_MINUTE = 60;
// const MINUTES_IN_HOUR = 60;
// const CACHE_MAXAGE = MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;

// const cache = setupCache({
//     maxAge: CACHE_MAXAGE,
// });

export let init = (config: { url: string; appKey: string }) => {};

const makkelijkeMarktAPI: Promise<AxiosInstance> = new Promise(resolve => {
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

export const getALijst = (token: string, marktId: string, marktDate: string): Promise<MMSollicitatieStandalone[]> => {
    const day = new Date(marktDate).getDay();

    if (A_LIJST_DAYS.includes(day)) {
        const monday = addDays(marktDate, MONDAY - day),
            thursday = addDays(marktDate, THURSDAY - day);

        return makkelijkeMarktAPI
            .then(api =>
                api.get(`lijst/week/${marktId}?startDate=${monday}&endDate=${thursday}`, {
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

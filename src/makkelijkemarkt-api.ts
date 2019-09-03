import { AxiosInstance, AxiosResponse } from 'axios';
import { addDays, MONDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY, requireEnv } from './util';
import { MMMarkt, MMOndernemerStandalone, MMSollicitatieStandalone, MMOndernemer } from './makkelijkemarkt.model';
const packageJSON = require('../package.json');
const axios = require('axios');

import { session } from './model/index';
import { upsert } from './sequelize-util.js';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;

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

type ApiBaseReturn = {
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

const apiBase = (config: ApiConfig): Promise<ApiBaseReturn> => {
    const api = axios.create({
        baseURL: config.baseUrl,
        headers: {
            MmAppKey: config.appKey,
        },
    });
    api.interceptors.response.use((response: any) => {
        return response;
    }, (error: any) => {
      if (error.response.status === 401) {
        //place your reentry code
        console.log('axios 401');
      }
      return error;
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
                }).then((data: ApiBaseReturn) => data);
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

export const getMarktondernemers = (): Promise<MMSollicitatieStandalone[]> =>
    apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) =>
        api.get<any, AxiosResponse<MMSollicitatieStandalone[]>>('koopman/', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    )
    .then(response => response.data);

export const getMarktondernemer = (id: string): Promise<MMOndernemerStandalone> =>
    apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) =>
        api.get<any, AxiosResponse<MMOndernemerStandalone>>(`koopman/erkenningsnummer/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    )
    .then(response => response.data);

export const getMarktondernemersByMarkt = (marktId: string): Promise<MMSollicitatieStandalone[]> =>
    apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) => {
            const recursiveCall = ((p: number, total: any[]): any => {

                return new Promise((resolve) => {
                    api.get(`sollicitaties/markt/${marktId}?listOffset=${p}&includeDoorgehaald=0`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }).then(response => {
                        if (response.data.length > 0) {

                            return resolve(recursiveCall(p + 100, [...total, ...response.data]));
                        } else {

                            return resolve(total);
                        }
                    });

                });
            });

            return recursiveCall(0, []);
        },
    ).then((response: any) => response);

export const getMarkt = (marktId: string): Promise<MMMarkt> =>
    apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) =>
        api.get(`markt/${marktId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    )
    .then(response => response.data);

export const getMarkten = (): Promise<MMMarkt[]> =>
    apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) =>
        api.get('markt/', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    )
    .then(response => response.data);

const A_LIJST_DAYS = [FRIDAY, SATURDAY, SUNDAY];

export const getALijst = (marktId: string, marktDate: string): Promise<MMOndernemer[]> => {
    const day = new Date(marktDate).getDay();

    if (A_LIJST_DAYS.includes(day)) {
        const monday = addDays(marktDate, MONDAY - day),
            thursday = addDays(marktDate, THURSDAY - day);

        return apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) =>
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

export const checkActivationCode = (username: string, code: string): Promise<any> =>
    getMarktondernemer(username).then(
        ondernemer => {
            if (!ondernemer.pasUid) {
                // This method of activation only works for people with a `pasUid`
                throw new Error('Incorrect username/password');
            } else {
                return {
                    isValid: typeof code === 'string' && code.length > 0 && code === ondernemer.pasUid,
                    erkenningsNummer: ondernemer.erkenningsnummer,
                };
            }
        },
        (err: Error) => {
            console.log(err);
            throw new Error('Incorrect username/password');
        },
    );

export const checkLogin = (): Promise<any> =>
    apiBase(mmConfig).then(({ token, api }: ApiBaseReturn) =>
        console.log('Login OK'),
    )
    .then(response => response);

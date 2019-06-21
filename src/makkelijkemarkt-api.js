const axios = require('axios');
const AxiosLogger = require('axios-logger');
const { setupCache } = require('axios-cache-adapter');
const { addDays, MONDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = require('./util.js');

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const CACHE_MAXAGE = MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;

const cache = setupCache({
    maxAge: CACHE_MAXAGE,
});

let makkelijkeMarktAPI;

const init = config => {
    makkelijkeMarktAPI = axios.create({
        baseURL: config.url,
        headers: {
            MmAppKey: config.appKey,
        },
        adapter: process.env.NODE_ENV === 'development' ? cache.adapter : undefined,
    });

    if (process.env.NODE_ENV === 'development') {
        makkelijkeMarktAPI.interceptors.request.use(AxiosLogger.requestLogger);
    }
};

const trace = arg => {
    console.log(arg);

    return arg;
};

const login = data => {
    // FIXME: Use RxJS for these asynchronous dependencies

    return makkelijkeMarktAPI
        .post('login/basicUsername/', {
            username: data.username,
            password: data.password,
            clientApp: data.clientApp,
            clientVersion: data.clientVersion,
        })
        .then(response => response.data);
};

const getMarktondernemers = token => {
    return makkelijkeMarktAPI
        .get('koopman/', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => response.data);
};

const getMarktondernemer = (token, id) => {
    return makkelijkeMarktAPI
        .get(`koopman/erkenningsnummer/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => response.data);
};

const getMarktondernemersByMarkt = (token, marktId) => {
    return makkelijkeMarktAPI
        .get(`lijst/week/${marktId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => response.data);
};

const getMarkt = (token, marktId) => {
    return makkelijkeMarktAPI
        .get(`markt/${marktId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => response.data);
};

const getMarkten = token => {
    return makkelijkeMarktAPI
        .get('markt/', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => response.data);
};

const A_LIJST_DAYS = [FRIDAY, SATURDAY, SUNDAY];

const getALijst = (token, marktId, marktDate) => {
    const day = new Date(marktDate).getDay();

    if (A_LIJST_DAYS.includes(day)) {
        const monday = addDays(marktDate, MONDAY - day),
            thursday = addDays(marktDate, THURSDAY - day);

        return makkelijkeMarktAPI
            .get(`lijst/week/${marktId}?startDate=${monday}&endDate=${thursday}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(response => response.data);
    } else {
        return new Promise(resolve => resolve([]));
    }
};

module.exports = {
    init,
    login,
    getALijst,
    getMarkt,
    getMarkten,
    getMarktondernemer,
    getMarktondernemers,
    getMarktondernemersByMarkt,
};

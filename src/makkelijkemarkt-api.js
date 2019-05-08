const axios = require('axios');

let makkelijkeMarktAPI;

const init = config => {
    makkelijkeMarktAPI = axios.create({
        baseURL: config.url,
        headers: {
            MmAppKey: config.appKey,
        },
    });
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
    return makkelijkeMarktAPI.get('koopman/', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
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

module.exports = {
    init,
    login,
    getMarkten,
    getMarktondernemers,
};

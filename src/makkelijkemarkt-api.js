const axios = require('axios');

let makkelijkeMarktAPI;

const trace = arg => {
    console.log(arg);

    return arg;
};

const login = data => {
    // FIXME: Use RxJS for these asynchronous dependencies
    makkelijkeMarktAPI = axios.create({
        baseURL: data.url,
        headers: {
            MmAppKey: data.appKey,
        },
    });

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
    login,
    getMarkten,
    getMarktondernemers,
};

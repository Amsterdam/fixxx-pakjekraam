'use strict';

const axios = require('axios');

let makkelijkeMarktAPI, loginResponse, token;

const login = data => {
    // FIXME: Use RxJS for these asynchronous dependencies
    makkelijkeMarktAPI = axios.create({
        baseURL: data.url,
        headers: {
            MmAppKey: data.appKey
        },
    });

    loginResponse = makkelijkeMarktAPI.post('login/basicUsername/', {
        username: data.username,
        password: data.password,
        clientApp: data.clientApp,
        clientVersion: data.clientVersion,
    }).then(response => response.data);

    token = loginResponse.then(data => data.uuid);
};

const getMarktondernemers = () => {
    return token
        .then(tokenUUID =>
            makkelijkeMarktAPI.get('koopman/', {
                headers: {
                    Authorization: `Bearer ${tokenUUID}`,
                },
            }),
        )
        .then(response => response.data);
};

const getMarkten = () => {
    return token
        .then(tokenUUID =>
            makkelijkeMarktAPI.get('markt/', {
                headers: {
                    Authorization: `Bearer ${tokenUUID}`,
                },
            }),
        )
        .then(response => response.data);
};

module.exports = {
    login,
    getMarkten,
    getMarktondernemers,
};

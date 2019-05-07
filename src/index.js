const express = require('express');
const packageJSON = require('../package.json');
const { login, getMarkten } = require('./makkelijkemarkt-api.js');

const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_DEFAULT_PORT = 8080;

const port = process.env.PORT || HTTP_DEFAULT_PORT;
const app = express();

login({
    username: process.env.API_USER,
    password: process.env.API_PASS,
    url: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
});

app.get('/api/1.0.0/markt/', (req, res) => {
    getMarkten().then(
        (markten) => {
            res.set({
                'Content-Type': 'application/json; charset=UTF-8'
            });
            res.send(JSON.stringify(markten));
        },
        (err) => {
            res.exit(HTTP_INTERNAL_SERVER_ERROR);
        },
    );
});

app.use(express.static('./src/www/'));

app.listen(port, (err) => {
    if (err) {
        console.error(err);
    }
    else {
        console.log(`Listening on port ${port}`);
    }
});

const { login, getMarkten: getMakkelijkeMarkten, getMarktondernemersByMarkt } = require('./makkelijkemarkt-api.js');
const { ALBERT_CUYP_ID, slugifyMarkt } = require('./domain-knowledge.js');
const fs = require('fs');

const loadJSON = (path, defaultValue = null) =>
    new Promise((resolve, reject) => {
        console.log(`Load ${path}`);
        fs.readFile(path, (err, data) => {
            if (err) {
                resolve(defaultValue);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            }
        });
    });

const getAanmeldingen = (marktId, date) => loadJSON(`./data/${slugifyMarkt(marktId)}/locaties.json`, []);

const getVoorkeuren = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/voorkeuren.json`, []);

const getBranches = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/branches.json`, []);

const getMarktplaatsen = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/locaties.json`, []);

const getLooplijstInput = (token, marktId, date) =>
    Promise.all([
        getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
            ondernemers
                .filter(ondernemer => !ondernemer.doorgehaald)
                .map(data => {
                    const { id, sollicitatieNummer, status } = data;

                    return {
                        description: `${data.koopman.voorletters} ${data.koopman.achternaam}`,
                        id,
                        // FIXME: Support multiple locations
                        locatie: data.vastePlaatsen ? parseInt(data.vastePlaatsen[0], 10) : undefined,
                        sollicitatieNummer,
                        status,
                    };
                }),
        ),
        getMarktplaatsen(marktId),
        getAanmeldingen(marktId, date),
        getVoorkeuren(marktId),
        getBranches(marktId),
    ]).then(args => {
        const [ondernemers, locaties, aanmeldingen, voorkeuren, branches] = args;

        return {
            locaties,
            aanmeldingen,
            voorkeuren,
            branches,
            ondernemers,
        };
    });

const getMarkten = token =>
    getMakkelijkeMarkten(token)
        // Only show markten for which JSON data with location info exists
        .then(markten => markten.filter(markt => fs.existsSync(`data/${slugifyMarkt(markt.id)}/locaties.json`)));

module.exports = {
    getAanmeldingen,
    getVoorkeuren,
    getBranches,
    getMarktplaatsen,
    getLooplijstInput,
    getMarkten,
};

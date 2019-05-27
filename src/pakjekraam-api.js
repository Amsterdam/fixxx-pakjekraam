const {
    login,
    getMarkt,
    getMarkten: getMakkelijkeMarkten,
    getMarktondernemersByMarkt,
} = require('./makkelijkemarkt-api.js');
const { ALBERT_CUYP_ID, formatOndernemerName, slugifyMarkt } = require('./domain-knowledge.js');
const { plaatsvoorkeur, rsvp } = require('./model/index.js');
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

const getAanmeldingen = (marktId, marktDate) => {
    return rsvp.findAll({
        where: { marktId, marktDate },
    });
};

const getAanmeldingenByOndernemer = erkenningsNummer => {
    return rsvp.findAll({
        where: { erkenningsNummer },
    });
};

const getPlaatsvoorkeuren = marktId => {
    return plaatsvoorkeur.findAll({
        where: { marktId },
    });
};

const getOndernemerVoorkeuren = erkenningsNummer => {
    return plaatsvoorkeur.findAll({
        where: { erkenningsNummer },
    });
};

const getBranches = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/branches.json`, []);

const getMarktplaatsen = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/locaties.json`, []);

const getMarktPaginas = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/paginas.json`, []);

const getMarktGeografie = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/geografie.json`, []);

const getIndelingslijstInput = (token, marktId, date) =>
    Promise.all([
        getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
            ondernemers
                .filter(ondernemer => !ondernemer.doorgehaald)
                .map(data => {
                    const {
                        id,
                        koopman: { erkenningsnummer },
                        sollicitatieNummer,
                        status,
                    } = data;

                    return {
                        description: formatOndernemerName(data.koopman),
                        id: erkenningsnummer,
                        erkenningsNummer: erkenningsnummer,
                        // FIXME: Support multiple locations
                        locatie: data.vastePlaatsen,
                        sollicitatieNummer,
                        status,
                    };
                }),
        ),
        getMarktplaatsen(marktId),
        getAanmeldingen(marktId, date),
        getPlaatsvoorkeuren(marktId),
        getBranches(marktId),
        getMarktPaginas(marktId),
        getMarktGeografie(marktId),
        getMarkt(token, marktId),
    ]).then(args => {
        const [ondernemers, locaties, aanmeldingen, voorkeuren, branches, paginas, geografie, markt] = args;

        return {
            locaties,
            aanmeldingen,
            voorkeuren,
            branches,
            ondernemers,
            paginas,
            geografie,
            markt,
        };
    });

const getSollicitantenlijstInput = (token, marktId, date) =>
    Promise.all([
        getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
            ondernemers.filter(ondernemer => !ondernemer.doorgehaald && ondernemer.status === 'soll'),
        ),
        getAanmeldingen(marktId, date),
        getPlaatsvoorkeuren(marktId),
        getMarkt(token, marktId),
    ]).then(args => {
        const [ondernemers, aanmeldingen, voorkeuren, markt] = args;

        return {
            ondernemers,
            aanmeldingen,
            voorkeuren,
            markt,
        };
    });

const getMarkten = token =>
    getMakkelijkeMarkten(token)
        // Only show markten for which JSON data with location info exists
        .then(markten => markten.filter(markt => fs.existsSync(`data/${slugifyMarkt(markt.id)}/locaties.json`)));

module.exports = {
    getAanmeldingen,
    getAanmeldingenByOndernemer,
    getPlaatsvoorkeuren,
    getOndernemerVoorkeuren,
    getBranches,
    getMarktplaatsen,
    getIndelingslijstInput,
    getMarkten,
    getSollicitantenlijstInput,
};

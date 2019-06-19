const {
    login,
    getALijst,
    getMarkt,
    getMarkten: getMakkelijkeMarkten,
    getMarktondernemersByMarkt,
} = require('./makkelijkemarkt-api.js');
const { ALBERT_CUYP_ID, formatOndernemerName, slugifyMarkt } = require('./domain-knowledge.js');
const { plaatsvoorkeur, rsvp } = require('./model/index.js');
const fs = require('fs');
const { calcToewijzingen } = require('./indeling.ts');

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

const getMarktProperties = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/markt.json`, []);

const getBranches = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/branches.json`, []);

const getAllBranches = () => loadJSON(`./data//branches.json`, []);

const getMarktplaatsen = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/locaties.json`, []);

const getMarktPaginas = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/paginas.json`, []);

const getMarktGeografie = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/geografie.json`, []);

const getIndelingslijstInput = (token, marktId, date) =>
    Promise.all([
        getMarktProperties(marktId),
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
                        plaatsen: data.vastePlaatsen,
                        voorkeur: {
                            aantalPlaatsen: Math.max(1, data.aantal3MeterKramen + data.aantal4MeterKramen),
                        },
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
        getALijst(token, marktId, date),
    ]).then(args => {
        const [
            marktProperties,
            ondernemers,
            locaties,
            aanmeldingen,
            voorkeuren,
            branches,
            paginas,
            geografie,
            markt,
            aLijst,
        ] = args;

        const marktplaatsen = locaties.map(locatie => ({
            plaatsId: locatie.plaatsId,
            branches: locatie.branche,
            inactive: locatie.inactive,
        }));

        return {
            ...marktProperties,
            locaties,
            aanmeldingen,
            voorkeuren,
            branches,
            ondernemers,
            paginas,
            geografie,
            markt,
            marktplaatsen,
            aanwezigheid: aanmeldingen,
            aLijst: aLijst.map(({ koopman: { erkenningsnummer } }) =>
                ondernemers.find(({ erkenningsNummer }) => erkenningsnummer === erkenningsNummer),
            ),
            rows: (
                marktProperties.rows ||
                paginas.reduce(
                    (list, pagina) => [
                        ...list,
                        ...pagina.indelingslijstGroup.map(group => group.plaatsList).filter(Array.isArray),
                    ],
                    [],
                )
            ).map(row => row.map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId))),
        };
    });

const getIndelingslijst = (token, marktId, date) => getIndelingslijstInput(token, marktId, date).then(calcToewijzingen);

const getSollicitantenlijstInput = (token, marktId, date) =>
    Promise.all([
        getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
            ondernemers.filter(
                ondernemer => !ondernemer.doorgehaald && (ondernemer.status === 'soll' || ondernemer.status === 'vkk'),
            ),
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
    getAllBranches,
    getMarktPaginas,
    getMarktProperties,
    getAanmeldingen,
    getAanmeldingenByOndernemer,
    getPlaatsvoorkeuren,
    getOndernemerVoorkeuren,
    getBranches,
    getMarktplaatsen,
    getIndelingslijst,
    getIndelingslijstInput,
    getMarkten,
    getSollicitantenlijstInput,
};

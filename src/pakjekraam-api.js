const {
    login,
    getALijst,
    getMarkt,
    getMarkten: getMakkelijkeMarkten,
    getMarktondernemersByMarkt,
} = require('./makkelijkemarkt-api.js');
const { ALBERT_CUYP_ID, formatOndernemerName, slugifyMarkt } = require('./domain-knowledge.js');
const { numberSort, stringSort } = require('./util.js');
const { Sequelize } = require('./model/index.js');
const models = require('./model/index.js');
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

/*
 * Convert a Sequelize instance to a regular object
 */
const toPlainInstance = inst => inst.get({ plain: true });

const getAanmeldingen = (marktId, marktDate) => {
    return models.rsvp.findAll({
        where: { marktId, marktDate },
    });
};

const getAanmeldingenByOndernemer = erkenningsNummer => {
    return models.rsvp.findAll({
        where: { erkenningsNummer },
    });
};

const getPlaatsvoorkeuren = marktId => {
    return models.plaatsvoorkeur.findAll({
        where: { marktId },
    });
};

const getVoorkeurenByMarktByOndernemer = (marktId, erkenningsNummer) => {
    return models.plaatsvoorkeur.findAll({
        where: { marktId, erkenningsNummer },
    });
};

const indelingVoorkeurPrio = voorkeur => (voorkeur.marktId ? 1 : 0) | (voorkeur.marktDate ? 2 : 0);
const indelingVoorkeurSort = (a, b) => numberSort(indelingVoorkeurPrio(a), indelingVoorkeurPrio(b));

const indelingVoorkeurMerge = (a, b) => ({
    ...a,
    ...Object.keys(b).reduce((state, key) => {
        if (b[key] !== null && typeof b[key] !== 'undefined') {
            state[key] = b[key];
        }

        return state;
    }, {}),
});

const getIndelingVoorkeur = (erkenningsNummer, marktId = null, marktDate = null) => {
    const where = {
        erkenningsNummer,
        [Sequelize.Op.and]: [
            { [Sequelize.Op.or]: [{ marktId }, { marktId: null }] },
            { [Sequelize.Op.or]: [{ marktDate }, { marktDate: null }] },
        ],
    };

    return models.voorkeur
        .findAll({
            where,
        })
        .then(voorkeuren =>
            voorkeuren
                .map(toPlainInstance)
                .sort(indelingVoorkeurSort)
                .reduce(indelingVoorkeurMerge, null),
        );
};

const groupByErkenningsNummer = (groups, voorkeur) => {
    let group;

    for (let i = groups.length; i--; ) {
        if (groups[i][0].erkenningsNummer === voorkeur.erkenningsNummer) {
            group = groups[i];
            break;
        }
    }

    if (group) {
        group.push(voorkeur);
    } else {
        groups.push([voorkeur]);
    }

    return groups;
};

const convertVoorkeur = obj => ({
    ...obj,
    branches: [obj.brancheId, obj.parentBrancheId].filter(Boolean),
    verkoopinrichting: obj.inrichting ? [obj.inrichting] : [],
});

const getIndelingVoorkeuren = (marktId, marktDate = null) => {
    const where = {
        [Sequelize.Op.and]: [
            {
                [Sequelize.Op.or]: marktId ? [{ marktId }, { marktId: null }] : [{ marktId: null }],
            },
            {
                [Sequelize.Op.or]: marktDate ? [{ marktDate }, { marktDate: null }] : [{ marktDate: null }],
            },
        ],
    };

    return models.voorkeur
        .findAll({
            where,
        })
        .then(voorkeuren =>
            voorkeuren
                .map(toPlainInstance)
                .sort((a, b) => indelingVoorkeurSort(a, b) || stringSort(a.erkenningsNummer, b.erkenningsNummer))
                .reduce(groupByErkenningsNummer, [])
                .map(arr => arr.reduce(indelingVoorkeurMerge)),
        );
};

const getOndernemerVoorkeuren = erkenningsNummer => {
    return models.plaatsvoorkeur.findAll({
        where: { erkenningsNummer },
    });
};

const getMarktProperties = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/markt.json`, []);

const getBranches = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/branches.json`, []);

const getAllBranches = () => loadJSON(`./data//branches.json`, []);

const getMarktplaatsen = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/locaties.json`, []);

const getMarktPaginas = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/paginas.json`, []);

const getMarktGeografie = marktId => loadJSON(`./data/${slugifyMarkt(marktId)}/geografie.json`, []);

/*
 * Convert an object from Makkelijke Markt to our own type of `IMarktondernemer` object
 */
const convertOndernemer = data => {
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
};

const getIndelingslijstInput = (token, marktId, marktDate) => {
    const ondernemersPromise = getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
        ondernemers.filter(ondernemer => !ondernemer.doorgehaald).map(convertOndernemer),
    );
    const voorkeurenPromise = getIndelingVoorkeuren(marktId, marktDate).then(voorkeuren =>
        voorkeuren.map(convertVoorkeur),
    );

    // Populate the `ondernemer.voorkeur` field
    const enrichedOndernemers = Promise.all([ondernemersPromise, voorkeurenPromise]).then(([ondernemers, voorkeuren]) =>
        ondernemers.map(ondernemer => ({
            ...ondernemer,
            voorkeur: {
                ...ondernemer.voorkeur,
                ...voorkeuren.find(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer),
            },
        })),
    );

    return Promise.all([
        getMarktProperties(marktId),
        enrichedOndernemers,
        getMarktplaatsen(marktId),
        getAanmeldingen(marktId, marktDate),
        getPlaatsvoorkeuren(marktId),
        getBranches(marktId),
        getMarktPaginas(marktId),
        getMarktGeografie(marktId),
        getMarkt(token, marktId),
        getALijst(token, marktId, marktDate),
    ]).then(args => {
        const [
            marktProperties,
            ondernemers,
            marktplaatsen,
            aanmeldingen,
            voorkeuren,
            branches,
            paginas,
            geografie,
            markt,
            aLijst,
        ] = args;

        return {
            marktId,
            marktDate,
            ...marktProperties,
            aanmeldingen,
            voorkeuren,
            branches,
            ondernemers,
            paginas,
            obstakels: geografie.obstakels || [],
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
};

const getIndelingslijst = (token, marktId, date) =>
    getIndelingslijstInput(token, marktId, date).then(data => {
        const logMessage = `Marktindeling berekenen: ${data.markt.naam}`;

        console.time(logMessage);
        const indeling = calcToewijzingen(data);
        console.timeEnd(logMessage);

        return indeling;
    });

const getMailContext = (token, marktId, erkenningsNr, marktDate) =>
    Promise.all([
        getIndelingslijst(token, marktId, marktDate),
        getVoorkeurenByMarktByOndernemer(marktId, erkenningsNr),
    ]).then(([markt, voorkeuren]) => {
        const ondernemer = markt.ondernemers.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const inschrijving = markt.aanwezigheid.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const toewijzing = markt.toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const afwijzing = markt.afwijzingen.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const voorkeurenObjectGroupedByPrio = (voorkeuren || []).reduce(function(hash, voorkeur) {
            if (!hash.hasOwnProperty(voorkeur.dataValues.priority)) hash[voorkeur.dataValues.priority] = [];
            hash[voorkeur.dataValues.priority].push(voorkeur.dataValues);
            return hash;
        }, {});
        const voorkeurenGroupedByPrio = Object.keys(voorkeurenObjectGroupedByPrio)
            .map(function(key) {
                return voorkeurenObjectGroupedByPrio[key];
            })
            .sort((a, b) => b[0].priority - a[0].priority)
            .map(voorkeuren => voorkeuren.map(voorkeur => voorkeur.plaatsId));
        return {
            markt,
            marktDate,
            ondernemer,
            inschrijving,
            toewijzing,
            afwijzing,
            voorkeuren: voorkeurenGroupedByPrio,
        };
    });

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
    getMailContext,
    getAllBranches,
    getMarktPaginas,
    getMarktProperties,
    getAanmeldingen,
    getAanmeldingenByOndernemer,
    getPlaatsvoorkeuren,
    getOndernemerVoorkeuren,
    getVoorkeurenByMarktByOndernemer,
    getBranches,
    getMarktplaatsen,
    getIndelingVoorkeur,
    getIndelingVoorkeuren,
    getIndelingslijst,
    getIndelingslijstInput,
    getMarkten,
    getSollicitantenlijstInput,
};

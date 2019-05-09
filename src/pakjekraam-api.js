const { login, getMarkten: getMakkelijkeMarkten, getMarktondernemersByMarkt } = require('./makkelijkemarkt-api.js');
const { ALBERT_CUYP_ID, slugifyMarkt } = require('./domain-knowledge.js');
const fs = require('fs');

const loadJSON = path => {
    console.log(`Load ${path}`);
    try {
        return JSON.parse(fs.readFileSync(path));
    } catch (e) {
        return null;
    }
};

const getLooplijstInput = (token, marktId) =>
    // new Promise(resolve => resolve(loadJSON(`tmp/lijst/week/${marktId}/index.json`)))
    getMarktondernemersByMarkt(token, marktId)
        .then(ondernemers =>
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
        )
        .then(ondernemers => {
            const slug = slugifyMarkt(marktId);

            return {
                locaties: loadJSON(`./data/${slug}/locaties.json`) || [],
                aanmeldingen: loadJSON(`./data/${slug}/aanmeldingen.json`) || [],
                voorkeuren: loadJSON(`./data/${slug}/voorkeuren.json`) || [],
                branches: loadJSON(`./data/${slug}/branches.json`) || [],
                ondernemers,
            };
        });

const getMarkten = token =>
    getMakkelijkeMarkten(token)
        // Only show markten for which JSON data with location info exists
        .then(markten => markten.filter(markt => fs.existsSync(`data/${slugifyMarkt(markt.id)}/locaties.json`)));

module.exports = {
    getLooplijstInput,
    getMarkten,
};

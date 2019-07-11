const models = require('./model/index.ts');
const { init, login } = require('./makkelijkemarkt-api.ts');
const { getMarkten, getIndelingslijst } = require('./pakjekraam-api.ts');
const packageJSON = require('../package.json');
const { flatten, today } = require('./util.js');

const loginSettings = {
    url: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
};

init(loginSettings);

login({
    username: process.env.API_READONLY_USER,
    password: process.env.API_READONLY_PASS,
}).then(session => {
    const token = session.uuid;

    const marktDate = today();
    const marktData = getMarkten(token);
    const indelingen = marktData.then(markten =>
        Promise.all(markten.map(markt => getIndelingslijst(token, markt.id, marktDate))),
    );

    const toewijzingData = indelingen.then(markten =>
        markten
            .map(markt =>
                markt.toewijzingen.map(toewijzing => ({
                    ...toewijzing,
                    marktId: markt.marktId,
                    marktDate,
                })),
            )
            .reduce(flatten, [])
            .map(toewijzing =>
                toewijzing.plaatsen.map(plaatsId => ({
                    marktId: toewijzing.marktId,
                    marktDate: toewijzing.marktDate,
                    plaatsId,
                    erkenningsNummer: toewijzing.erkenningsNummer,
                })),
            )
            .reduce(flatten, []),
    );

    models.sequelize
        .transaction(transaction =>
            // TODO: In the future, never destroy existing allocations
            Promise.all([models.allocation.destroy({ transaction, where: { marktDate } })]).then(() =>
                toewijzingData.then(rows => models.allocation.bulkCreate(rows, { validate: true, transaction })),
            ),
        )
        .then(
            affectedRows => {
                console.log(`Market allocation for ${marktDate} succeeded. ${affectedRows.length} allocations stored.`);
                process.exit(0);
            },
            err => {
                console.log('Market allocation failed.');
                console.error(err);
                process.exit(1);
            },
        );
});

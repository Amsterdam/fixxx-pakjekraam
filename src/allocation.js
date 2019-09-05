const models = require('./model/index.ts');
const { getMarkten, getIndelingslijst } = require('./pakjekraam-api.ts');
const packageJSON = require('../package.json');
const { flatten, tomorrow } = require('./util.ts');

const marktDate = tomorrow();
const marktData = getMarkten();
const indelingen = marktData.then(markten => Promise.all(markten.map(markt => getIndelingslijst(markt.id, marktDate))));

const toewijzingData = indelingen.then(markten =>
    markten
        .map(markt =>
            markt.toewijzingen.map(toewijzing => ({
                ...toewijzing,
                marktId: markt.marktId,
                marktDate
            }))
        )
        .reduce(flatten, [])
        .map(toewijzing =>
            toewijzing.plaatsen.map(plaatsId => ({
                marktId: toewijzing.marktId,
                marktDate: toewijzing.marktDate,
                plaatsId,
                erkenningsNummer: toewijzing.erkenningsNummer
            }))
        )
        .reduce(flatten, [])
);

models.sequelize
    .transaction(transaction =>
        // TODO: In the future, never destroy existing allocations
        Promise.all([models.allocation.destroy({ transaction, where: { marktDate } })]).then(() =>
            toewijzingData.then(rows => models.allocation.bulkCreate(rows, { validate: true, transaction }))
        )
    )
    .then(
        affectedRows => {
            process.exit(0);
        },
        err => {
            process.exit(1);
        }
    );

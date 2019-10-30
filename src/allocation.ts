const models = require('./model/index.ts');
const { getMarkten, getIndelingslijst } = require('./pakjekraam-api.ts');

const { flatten, tomorrow } = require('./util.ts');
import { convertToewijzingForDB } from './model/allocation.functions';
import { convertAfwijzingForDB } from './model/afwijzing.functions';
import { MMMarkt } from './makkelijkemarkt.model';
import { IMarkt } from './markt.model';

import { sequelize } from './model/index';

const marktDate = tomorrow();

const mapMarktenToToewijzingen = (markten: any) => {
    return markten
    .map((markt: any) =>
        markt.toewijzingen.map( (toewijzing: any) => convertToewijzingForDB(toewijzing, markt, marktDate)),
    )
    .reduce(flatten, [])
    .map( ( toewijzing: any) =>
        toewijzing.plaatsen.map((plaatsId: string) => ({
            marktId: toewijzing.marktId,
            marktDate: toewijzing.marktDate,
            plaatsId,
            erkenningsNummer: toewijzing.erkenningsNummer,
        })),
    )
    .reduce(flatten, []);
};


const mapMarktenToAfwijzingen = (markten: any) => {
    return markten
    .map((markt: any) =>
        markt.afwijzingen.map( (afwijzing: any) => convertAfwijzingForDB(afwijzing, markt, marktDate)),
    )
    .reduce(flatten, []);
};

async function destroyAndCreateToewijzingenAfwijzingen(result: any) {
    const transaction = await sequelize.transaction();
    await models.allocation.destroy({ where: { marktDate }, transaction });
    await models.afwijzing.destroy({ where: { marktDate }, transaction });
    await models.allocation.bulkCreate(result[0], { validate: true }, transaction);
    await models.afwijzing.bulkCreate(result[1], { validate: true }, transaction);
    await transaction.commit();
}

getMarkten()
    .then((markten: MMMarkt[]) => {
        markten = markten.filter( markt => markt.id === 20);
        return Promise.all(markten.map(markt => getIndelingslijst(markt.id, marktDate)));
    })
    .then( (marktenEnriched: IMarkt[] ) => {
        return Promise.all( [ mapMarktenToToewijzingen(marktenEnriched), mapMarktenToAfwijzingen(marktenEnriched) ] );
    })
    .then( (result: any) => {
        return destroyAndCreateToewijzingenAfwijzingen(result);
    })
    .catch( (e: any) => {
        console.log(e);
    });

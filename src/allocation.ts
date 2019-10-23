const models = require('./model/index.ts');
const { getMarkten, getIndelingslijst } = require('./pakjekraam-api.ts');

const { flatten, tomorrow } = require('./util.ts');
import { convertToewijzingForDB } from './model/allocation.functions';
import { convertAfwijzingForDB } from './model/afwijzing.functions';
import { MMMarkt } from './makkelijkemarkt.model';
import { IMarkt } from './markt.model';
import { Transaction } from 'sequelize/types';

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


const createToewijzingen = (toewijzingen: any) => {
    models.sequelize
    .transaction((transaction: Transaction) =>
        // TODO: In the future, never destroy existing allocations
        Promise.all([models.allocation.destroy({ transaction, where: { marktDate } })]).then(() =>
            models.allocation.bulkCreate(toewijzingen, { validate: true, transaction })
        )
    )
    .then(
        (affectedRowsL: any) => {
            process.exit(0);
        },
        (err: Error) => {
            console.log(err);
            process.exit(1);
        },
    );
};


const createAfwijzingen = (afwijzingen: any) => {
    models.sequelize
    .transaction((transaction: Transaction) =>
        // TODO: In the future, never destroy existing allocations
        Promise.all([models.afwijzing.destroy({ transaction, where: { marktDate } })]).then(() =>
            models.afwijzing.bulkCreate(afwijzingen, { validate: true, transaction })
        )
    )
    .then(
        (affectedRowsL: any) => {
            process.exit(0);
        },
        (err: Error) => {
            console.log(err);
            process.exit(1);
        },
    );
};

getMarkten()
    .then((markten: MMMarkt[]) => {
        markten = markten.filter( markt => markt.id === 20);
        return Promise.all(markten.map(markt => getIndelingslijst(markt.id, marktDate)));
    })
    .then( (marktenEnriched: IMarkt[] ) => {
        return Promise.all( [ mapMarktenToToewijzingen(marktenEnriched), mapMarktenToAfwijzingen(marktenEnriched) ] );
    })
    .then( (result: any) => {
        return Promise.all([createToewijzingen(result[0]),createAfwijzingen(result[1])]);
    })
    .catch((e: Error) => {
        // console.log(e);
    });


const models = require('./model/index.ts');
import { getIndelingslijst, getDaysClosed } from './pakjekraam-api';

import { flatten, tomorrow, today, toISODate } from './util';
import { convertToewijzingForDB, getToewijzingEnriched } from './model/allocation.functions';
import { convertAfwijzingForDB, getAfwijzingEnriched } from './model/afwijzing.functions';
// import { MMMarkt } from './makkelijkemarkt.model';
// import { IMarkt, IMarktEnriched } from './markt.model';
import { getMarktenByDate } from './model/markt.functions';

import { sequelize } from './model/index';
import { IToewijzing, IAfwijzing } from 'markt.model';
import { MMMarkt } from 'makkelijkemarkt.model';

const marktDate = today();

const mapMarktenToToewijzingen = (markten: any): Promise<IToewijzing[]> => {
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

const mapMarktenToAfwijzingen = (markten: any): Promise<IAfwijzing[]> => {
    return markten
        .map((markt: any) =>
            markt.afwijzingen.map( (afwijzing: any) => convertAfwijzingForDB(afwijzing, markt, marktDate)),
        )
        .reduce(flatten, []);
};

async function destroyAndCreateToewijzingenAfwijzingen(toewijzingen: IToewijzing[], afwijzingen: IAfwijzing[]) {
    try {
        const transaction = await sequelize.transaction();
        await models.allocation.destroy({ where: { marktDate }, transaction });
        await models.afwijzing.destroy({ where: { marktDate }, transaction });
        await models.allocation.bulkCreate(toewijzingen, { validate: true }, transaction);
        await models.afwijzing.bulkCreate(afwijzingen, { validate: true }, transaction);
        await transaction.commit();
        process.exit();
    } catch(e) {
        console.log(e);
        process.exit();
    }
}

async function allocation() {

    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = toISODate(tomorrow);
        const daysClosed = await getDaysClosed();
        daysClosed.includes(tomorrowString) ? console.log(`Indeling wordt niet gedraaid, ${tomorrowString} gevonden in daysClosed.json`) : runAllocation();
    } catch(e) {
        console.log(e);
        process.exit();
    }

}

async function runAllocation() {

    try {

        let markten = await getMarktenByDate(marktDate);

        markten = markten.filter(markt => markt.kiesJeKraamFase)
            .filter( (markt: MMMarkt) => markt.kiesJeKraamFase === 'live' || markt.kiesJeKraamFase === 'wenperiode');

        if (markten.length > 0) {

            const indelingen = await Promise.all(markten.map( (markt: MMMarkt) => getIndelingslijst(String(markt.id), marktDate)));

            const toewijzingen = await mapMarktenToToewijzingen(indelingen);
            const afwijzingen = await mapMarktenToAfwijzingen(indelingen);

            const toewijzingenEnriched = await Promise.all(
                toewijzingen.map(toewijzing => getToewijzingEnriched(toewijzing)
            ));

            const afwijzingenEnriched = await Promise.all(
                afwijzingen.map(afwijzing => getAfwijzingEnriched(afwijzing)
            ));

            await destroyAndCreateToewijzingenAfwijzingen(toewijzingenEnriched, afwijzingenEnriched);

        } else {
            console.log('Geen indelingen gedraaid.');
            process.exit();
        }

    }   catch(e) {
        console.log(e);
        process.exit();
    }

}

allocation();

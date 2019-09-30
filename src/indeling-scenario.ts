import { DeelnemerStatus, IMarktondernemer, IPlaatsvoorkeur, IMarktplaats, IRSVP } from './markt.model';
import {
    IMarktScenario,
    IMarktScenarioStub,
    IMarktplaatsStub,
    IMarktondernemerStub,
    IRSVPStub,
    IPlaatsvoorkeurStub
} from './indeling-scenario.model';

import {
    flatten
} from './util';

const VOORKEUR_MINIMUM_PRIORITY = 0;
const VOORKEUR_DEFAULT_PRIORITY = VOORKEUR_MINIMUM_PRIORITY + 1;

const isVast = (status: DeelnemerStatus): boolean =>
    status === DeelnemerStatus.VASTE_PLAATS ||
    status === DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS;

const ondernemerAanmelding = (ondernemer: IMarktondernemer, marktId: string, marktDate: string): IRSVP => ({
    marktId,
    marktDate,
    erkenningsNummer: ondernemer.erkenningsNummer,
    attending: true
});

/*
 * Assume everyone with a status that requires a high level of attendance will be attending.
 */
const deFactoAanmeldingen = (ondernemers: IMarktondernemer[], marktId: string, marktDate: string): IRSVP[] =>
    ondernemers
    .filter(ondernemer => isVast(ondernemer.status))
    .map(ondernemer => ondernemerAanmelding(ondernemer, marktId, marktDate));

/*
 * Compare RSVP objects, return `true` when they are about the same RSVP
 * (but don't necessarily have the same content).
 */
const isEqualRSVPKey = (a: IRSVP, b: IRSVP): boolean =>
    a.marktId === b.marktId && a.marktDate === b.marktDate && a.erkenningsNummer === b.erkenningsNummer;

type scenarioUtils = {
    aanmelding: (stub: IRSVPStub) => IRSVP;
    plaats: (stub: IMarktplaatsStub) => IMarktplaats;
    ondernemer: (stub: IMarktondernemerStub) => IMarktondernemer;
    voorkeur: (stub: IPlaatsvoorkeurStub) => IPlaatsvoorkeur;
};

const marktScenario = (callback: (utils: scenarioUtils) => IMarktScenarioStub): IMarktScenario => {
    let plaatsIncrement = 1;
    let sollicitatiesIncrement = 1;
    let erkenningsNummerIncrement = 1970010101;

    const marktId = '1';
    const marktDate = '1970-01-01';
    const ondernemers: IMarktondernemer[] = [];

    const findOndernemer = (desc: { sollicitatieNummer?: number; erkenningsNummer?: string }): IMarktondernemer =>
        ondernemers.find(
            ondernemer =>
                ondernemer.sollicitatieNummer === desc.sollicitatieNummer ||
                ondernemer.erkenningsNummer === desc.erkenningsNummer
        );

    const plaats = (data: IMarktplaatsStub): IMarktplaats => {
        const plaatsId = data && data.plaatsId || String(plaatsIncrement++);
        return {
            plaatsId,
            ...data
        };
    };

    const ondernemer = (data: IMarktondernemerStub = {}): IMarktondernemer => {
        const existingOndernemer = findOndernemer(data);

        if (existingOndernemer) {
            return existingOndernemer;
        }

        const {
            erkenningsNummer = String(erkenningsNummerIncrement++),
            sollicitatieNummer = sollicitatiesIncrement++,
            status = DeelnemerStatus.SOLLICITANT
        } = data;

        const newOndernemer = {
            status,
            sollicitatieNummer,
            erkenningsNummer,
            description: 'Jane Doe',
            ...data,
            voorkeur: {
                maximum: data.plaatsen ? data.plaatsen.length : null,
                ...data.voorkeur
            }
        };

        ondernemers.push(newOndernemer);

        return newOndernemer;
    };

    const voorkeur = (data: IPlaatsvoorkeurStub): IPlaatsvoorkeur => {
        const ondernemer = findOndernemer(data);

        return {
            marktId,
            erkenningsNummer: ondernemer ? ondernemer.erkenningsNummer : undefined,
            sollicitatieNummer: ondernemer ? ondernemer.sollicitatieNummer : undefined,
            priority: VOORKEUR_DEFAULT_PRIORITY,
            ...data
        };
    };

    const aanmelding = (data: IRSVPStub): IRSVP => {
        const ondernemer = findOndernemer(data);

        if (!ondernemer) {
            throw Error(`Define ondernemer ${data.erkenningsNummer || data.sollicitatieNummer} before use`);
        }

        const { erkenningsNummer, sollicitatieNummer } = ondernemer;

        return {
            marktId,
            marktDate,
            erkenningsNummer,
            sollicitatieNummer,
            attending: !!data.attending,
            ...data
        };
    };

    const defaultMarkt: IMarktScenario = {
        marktId,
        marktDate,
        ondernemers: [],
        aanwezigheid: [],
        voorkeuren: [],
        marktplaatsen: [],
        rows: [],
        aLijst: [],
        branches: [],
        obstakels: []
    };

    const seed: IMarktScenarioStub = callback({ plaats, ondernemer, voorkeur, aanmelding });

    const seedMixin = {
        aanwezigheid: seed.aanwezigheid || [],
        marktplaatsen: seed.marktplaatsen || [],
        ondernemers: seed.ondernemers || [],
        voorkeuren: seed.voorkeuren || [],
        aLijst: seed.aLijst || [],
        branches: seed.branches || [],
        expansionLimit: seed.expansionLimit,
        obstakels: seed.obstakels
    };

    const markt: IMarktScenario = {
        ...defaultMarkt,
        ...seedMixin
    };

    if (seed.rows) {
        if (!markt.marktplaatsen.length) {
            markt.marktplaatsen = seed.rows
            .reduce(flatten, [])
            .reduce((a, b) => a.includes(b) ? a : [...a, b], [])
            .map(plaatsId => ({ plaatsId }));
        }
        markt.rows = seed.rows.map(row =>
            row.map(plaatsRef => markt.marktplaatsen.find(({ plaatsId }) => plaatsId === plaatsRef))
        );
    } else {
        /*
         * When no physical distribution is provided,
         * assume there is one big row that is ordered by `plaatsId` in numeric order.
         */
        markt.rows = [
            [...markt.marktplaatsen].sort((plaatsA, plaatsB) => Number(plaatsA.plaatsId) - Number(plaatsB.plaatsId))
        ];
    }

    if (seed.aanwezigheid) {
        markt.aanwezigheid = [
            ...seed.aanwezigheid,
            ...deFactoAanmeldingen(markt.ondernemers, marktId, marktDate).filter(
                deFactoAanmelding =>
                    !markt.aanwezigheid.find(aanmelding => isEqualRSVPKey(aanmelding, deFactoAanmelding))
            )
        ];
    } else {
        /*
         * When the scenario doesn't go into specifics about who is attending and who isn't,
         * assume everyone form `ondernemers` will be attending.
         */
        markt.aanwezigheid = markt.ondernemers.map(ondernemer =>
            ondernemerAanmelding(ondernemer, markt.marktId, markt.marktDate)
        );
    }

    return markt;
};

module.exports = {
    marktScenario
};

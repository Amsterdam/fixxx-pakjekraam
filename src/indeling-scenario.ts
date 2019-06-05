import { DeelnemerStatus, IMarktondernemer, IPlaatsvoorkeur, IMarktplaats, IRSVP } from './markt.model';
import {
    IMarktScenario,
    IMarktScenarioStub,
    IMarktplaatsStub,
    IMarktondernemerStub,
    IRSVPStub,
    IPlaatsvoorkeurStub,
} from './indeling-scenario.model';

const VOORKEUR_MINIMUM_PRIORITY = 0;
const VOORKEUR_DEFAULT_PRIORITY = VOORKEUR_MINIMUM_PRIORITY + 1;

const stringSort = (a: string, b: string): number => (a > b ? 1 : a === b ? 0 : -1);

const isVast = (status: DeelnemerStatus): boolean =>
    status === DeelnemerStatus.VASTE_PLAATS || status === DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS;

const ondernemerAanmelding = (ondernemer: IMarktondernemer, marktId: number, marktDate: string): IRSVP => ({
    marktId,
    marktDate,
    erkenningsNummer: ondernemer.erkenningsNummer,
    attending: true,
});

/*
 * Assume everyone with a status that requires a high level of attendance will be attending.
 */
const deFactoAanmeldingen = (ondernemers: IMarktondernemer[], marktId: number, marktDate: string): IRSVP[] =>
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
    marktplaats: (stub: IMarktplaatsStub) => IMarktplaats;
    ondernemer: (stub: IMarktondernemerStub) => IMarktondernemer;
    voorkeur: (stub: IPlaatsvoorkeurStub) => IPlaatsvoorkeur;
};

const marktScenario = (callback: (utils: scenarioUtils) => IMarktScenarioStub): IMarktScenario => {
    let plaatsIncrement = 1;
    let sollicitatiesIncrement = 1;
    let erkenningsNummerIncrement = 1970010101;

    const marktId = 1;
    const marktDate = '1970-01-01';
    const ondernemers: IMarktondernemer[] = [];

    const findOndernemer = (desc: { sollicitatieNummer?: number; erkenningsNummer?: string }): IMarktondernemer =>
        ondernemers.find(
            ondernemer =>
                ondernemer.sollicitatieNummer === desc.sollicitatieNummer ||
                ondernemer.erkenningsNummer === desc.erkenningsNummer,
        );

    const marktplaats = (data: IMarktplaatsStub): IMarktplaats => ({
        plaatsId: String(plaatsIncrement++),
        ...data,
    });

    const ondernemer = (data: IMarktondernemerStub = {}): IMarktondernemer => {
        const existingOndernemer = findOndernemer(data);

        if (existingOndernemer) {
            return existingOndernemer;
        }

        const {
            erkenningsNummer = String(erkenningsNummerIncrement++),
            sollicitatieNummer = sollicitatiesIncrement++,
            status = DeelnemerStatus.SOLLICITANT,
        } = data;

        const newOndernemer = {
            status,
            sollicitatieNummer,
            erkenningsNummer,
            description: 'Jane Doe',
            ...data,
            voorkeur: {
                aantalPlaatsen: data.plaatsen ? data.plaatsen.length : 1,
                ...data.voorkeur,
            },
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
            ...data,
        };
    };

    const aanmelding = (data: IRSVPStub): IRSVP => {
        const ondernemer = findOndernemer(data);

        if (!ondernemer) {
            throw new Error(`Define ondernemer ${data.erkenningsNummer || data.sollicitatieNummer} before use`);
        }

        const { erkenningsNummer, sollicitatieNummer } = ondernemer;

        return {
            marktId,
            marktDate,
            erkenningsNummer,
            sollicitatieNummer,
            attending: !!data.attending,
            ...data,
        };
    };

    const defaultMarkt: IMarktScenario = {
        id: marktId,
        marktDate,
        ondernemers: [],
        aanwezigheid: [],
        voorkeuren: [],
        marktplaatsen: [],
        rows: [],
        aLijst: [],
        branches: [],
    };

    const seed: IMarktScenarioStub = callback({ marktplaats, ondernemer, voorkeur, aanmelding });

    const markt: IMarktScenario = {
        ...defaultMarkt,
        ...seed,
    };

    if (!seed.rows) {
        /*
         * When no physical distribution is provided,
         * assume there is one big row that is ordered by `plaatsId` in alphanumeric order.
         */
        markt.rows = [
            [...markt.marktplaatsen].sort((plaatsA, plaatsB) => stringSort(plaatsA.plaatsId, plaatsB.plaatsId)),
        ];
    }

    if (seed.aanwezigheid) {
        markt.aanwezigheid = [
            ...seed.aanwezigheid,
            ...deFactoAanmeldingen(markt.ondernemers, marktId, marktDate).filter(
                deFactoAanmelding =>
                    !markt.aanwezigheid.find(aanmelding => isEqualRSVPKey(aanmelding, deFactoAanmelding)),
            ),
        ];
    } else {
        /*
         * When the scenario doesn't go into specifics about who is attending and who isn't,
         * assume everyone form `ondernemers` will be attending.
         */
        markt.aanwezigheid = markt.ondernemers.map(ondernemer =>
            ondernemerAanmelding(ondernemer, markt.id, markt.marktDate),
        );
    }

    console.log(markt);

    return markt;
};

module.exports = {
    marktScenario,
};

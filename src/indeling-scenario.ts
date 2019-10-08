import {
    DeelnemerStatus,
    IMarktondernemer,
    IPlaatsvoorkeur,
    IMarktplaats,
    IRSVP
} from './markt.model';

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

const createRSVP = (
    ondernemer: IMarktondernemer,
    marktId: string,
    marktDate: string
): IRSVP => ({
    marktId,
    marktDate,
    erkenningsNummer: ondernemer.erkenningsNummer,
    attending: true
});
const isEqualRSVPKey = (a: IRSVP, b: IRSVP): boolean =>
    a.marktId === b.marktId &&
    a.marktDate === b.marktDate &&
    a.erkenningsNummer === b.erkenningsNummer;

// Genereer RSVPs voor alle VPHs.
const deFactoAanmeldingen = (
    ondernemers: IMarktondernemer[],
    marktId: string,
    marktDate: string
): IRSVP[] =>
    ondernemers
    .filter(ondernemer => isVast(ondernemer.status))
    .map(ondernemer => createRSVP(ondernemer, marktId, marktDate));

const findOndernemer = (
    markt: IMarktScenario,
    desc: { sollicitatieNummer?: number; erkenningsNummer?: string }
): IMarktondernemer =>
    markt.ondernemers.find(ondernemer =>
        ondernemer.sollicitatieNummer === desc.sollicitatieNummer ||
        ondernemer.erkenningsNummer === desc.erkenningsNummer
    );

const marktScenario = (seed: IMarktScenarioStub): IMarktScenario => {
    let plaatsIncrement           = 1;
    let sollicitatiesIncrement    = 1;
    let erkenningsNummerIncrement = 1970010101;

    const marktId   = '1';
    const marktDate = 'marktDate' in seed ?
                      seed.marktDate :
                      (new Date()).toISOString().slice(0,10);

    const markt: IMarktScenario = {
        marktId,
        marktDate,
        marktplaatsen  : undefined,
        rows           : undefined,
        ondernemers    : undefined,
        aanwezigheid   : undefined,
        voorkeuren     : undefined,
        aLijst         : undefined,
        branches       : seed.branches || [],
        expansionLimit : seed.expansionLimit || Infinity,
        obstakels      : seed.obstakels || []
    };

    markt.marktplaatsen = (seed.marktplaatsen || [])
    .map((data: IMarktplaatsStub): IMarktplaats => {
        const plaatsId = data && data.plaatsId || String(plaatsIncrement++);
        return {
            plaatsId,
            ...data
        };
    });

    if (seed.rows) {
        if (!markt.marktplaatsen.length) {
            markt.marktplaatsen = seed.rows
            .reduce(flatten, [])
            .reduce((a, b) => a.includes(b) ? a : [...a, b], [])
            .map(plaatsId => ({ plaatsId }));
        }
        markt.rows = seed.rows.map(row =>
            row.map(plaatsRef =>
                markt.marktplaatsen.find(({ plaatsId }) => plaatsId === plaatsRef)
            )
        );
    } else {
        // When no physical distribution is provided, assume there is one big
        // row that is ordered by `plaatsId` in numeric order.
        markt.rows = [
            [...markt.marktplaatsen].sort((plaatsA, plaatsB) =>
                Number(plaatsA.plaatsId) - Number(plaatsB.plaatsId)
            )
        ];
    }

    markt.ondernemers = (seed.ondernemers || [])
    .map((data: IMarktondernemerStub = {}): IMarktondernemer => {
        const {
            erkenningsNummer   = String(erkenningsNummerIncrement++),
            sollicitatieNummer = sollicitatiesIncrement++,
            status             = DeelnemerStatus.SOLLICITANT
        } = data;

        return {
            status,
            sollicitatieNummer,
            erkenningsNummer,
            description: 'Jane Doe',
            ...data,
            voorkeur: { ...data.voorkeur }
        };
    });

    // Als er voor dit scenario geen `aanwezigheid` array is gedefinieerd worden
    // alle ondernemers standaard aangemeld.
    //
    // Is er wel een `aanwezigheid`, dan wordt deze aangevuld met een standaard
    // aanmelding voor alle VPHs die niet in de lijst voorkomen (dus als er een
    // VPH expliciet is afgemeld zal deze niet overschreven worden).
    //
    // In dit laatste scenario worden SOLL dus niet meer standaard aangemeld; dat
    // moet expliciet in `aanwezigheid` gedaan worden.
    if (seed.aanwezigheid) {
        markt.aanwezigheid = seed.aanwezigheid.map((data: IRSVPStub): IRSVP => {
            const ondernemer = findOndernemer(markt, data);
            if (!ondernemer) {
                throw Error('Ondernemer not found');
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
        });

        const deFacto = deFactoAanmeldingen(markt.ondernemers, marktId, marktDate)
        .filter(deFactoAanmelding =>
            !markt.aanwezigheid.find(aanmelding => isEqualRSVPKey(aanmelding, deFactoAanmelding))
        );

        markt.aanwezigheid = [
            ...markt.aanwezigheid,
            ...deFacto
        ];
    } else {
        markt.aanwezigheid = markt.ondernemers.map(ondernemer =>
            createRSVP(ondernemer, markt.marktId, markt.marktDate)
        );
    }

    markt.voorkeuren = (seed.voorkeuren || [])
    .map((data: IPlaatsvoorkeurStub): IPlaatsvoorkeur => {
        const ondernemer = findOndernemer(markt, data);
        if (!ondernemer) {
            throw Error('Ondernemer not found');
        }

        return {
            marktId,
            erkenningsNummer: ondernemer.erkenningsNummer,
            sollicitatieNummer: ondernemer.sollicitatieNummer,
            priority: VOORKEUR_DEFAULT_PRIORITY,
            ...data
        };
    });

    markt.aLijst = (seed.aLijst || [])
    .map((data: IMarktondernemerStub): IMarktondernemer => {
        const ondernemer = findOndernemer(markt, data);
        if (!ondernemer) {
            throw Error('Ondernemer not found');
        }

        return ondernemer;
    });

    return markt;
};

module.exports = {
    marktScenario
};

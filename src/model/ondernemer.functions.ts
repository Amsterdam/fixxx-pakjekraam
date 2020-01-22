import { getMarktondernemersByMarkt as getMarktondernemersByMarktMM } from '../makkelijkemarkt-api';
import {
    IMarktondernemer,
    IMarktondernemerVoorkeur,
    IRSVP,
    IToewijzing,
} from '../markt.model';

import { getVoorkeurenAbsentByMarkt } from './voorkeur.functions';

import { MMSollicitatieStandalone } from '../makkelijkemarkt.model';
import { formatOndernemerName } from '../domain-knowledge.js';
import { today } from '../util';


export const ondernemerIsAfgemeld = (ondernemer: IMarktondernemer, aanmeldingen: IRSVP[], currentMarktDate: String): Boolean => {

    const rsvp = aanmeldingen.find(({ erkenningsNummer, marktDate }) =>
        erkenningsNummer === ondernemer.erkenningsNummer && marktDate === currentMarktDate
    );

    // Bij de indeling van VPHs worden alleen expliciete afmeldingen in beschouwing
    // genomen. Anders wordt een VPH automatisch als aangemeld beschouwd.
    if (rsvp && !rsvp.attending) {
        return true;
    } else {
        return false;
    }

};

export const ondernemerIsAfgemeldPeriode = (voorkeur: IMarktondernemerVoorkeur, marktDate: Date): Boolean => {

    if (
        voorkeur.absentFrom && voorkeur.absentUntil &&
        marktDate >= voorkeur.absentFrom &&
        marktDate <= voorkeur.absentUntil
    ) {
        return true;
    } else {
        return false;
    }

};

export const filterOndernemersAangemeld = (ondernemers: IMarktondernemer[], algemenevoorkeuren: IMarktondernemerVoorkeur[], aanmeldingen: IRSVP[], marktDate: Date): IMarktondernemer[] => {

    ondernemers.map(ondernemer => {
        ondernemer.voorkeur = algemenevoorkeuren.find(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer);
        return ondernemer;
    });

    ondernemers = ondernemers.filter( ondernemer => {
        if (ondernemer.voorkeur) {
            return !ondernemerIsAfgemeldPeriode(ondernemer.voorkeur, marktDate);
        } else {
            return true;
        }
    });

    let sollicanten = ondernemers.filter(ondernemer => ondernemer.status === 'soll');
    let vphs = ondernemers.filter(ondernemer => ondernemer.status === 'vpl');

    sollicanten = sollicanten.filter(ondernemer => {
        const aanmelding = aanmeldingen.find(aanmelding => (aanmelding.erkenningsNummer === ondernemer.erkenningsNummer));
        if (aanmelding) {
            return aanmelding.attending;
        } else {
            return false;
        }
    });

    vphs = vphs.filter(ondernemer => {
        const aanmelding = aanmeldingen.find(aanmelding => (aanmelding.erkenningsNummer === ondernemer.erkenningsNummer));
        if (aanmelding) {
            return aanmelding.attending;
        } else {
            return true;
        }
    });

    return [ ...sollicanten, ...vphs ];
};

export const vphIsGewisseld = (ondernemer: IMarktondernemer, toewijzingen: IToewijzing[]): Boolean => {

    const toewijzingVph = toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === ondernemer.erkenningsNummer);

    if (!toewijzingVph) {
        return false;
    }

    toewijzingVph.plaatsen.sort(( a: any, b: any ) => a - b);
    ondernemer.plaatsen.sort(( a: any, b: any ) => a - b);

    if (
        // Als de arrays hetzelfde zijn is er niet gewisseld
        JSON.stringify(toewijzingVph.plaatsen) !== JSON.stringify(ondernemer.plaatsen) &&
        // Als alle plaatsen van de ondernemer voorkomen in de toewijzing is er niet gewisseld
        !ondernemer.plaatsen.every( (item) => toewijzingVph.plaatsen.indexOf(item) !== -1 )
    ) {
        return true;
    } else {
        return false;
    }

};

export const vphIsUitgebreid = (ondernemer: IMarktondernemer, toewijzingen: IToewijzing[]): Boolean => {
    const toewijzingVph = toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === ondernemer.erkenningsNummer);

    if (!toewijzingVph) {
        return false;
    }

    toewijzingVph.plaatsen.sort(( a: any, b: any ) => a - b);
    ondernemer.plaatsen.sort(( a: any, b: any ) => a - b);

    if (
        toewijzingVph.plaatsen.length > ondernemer.plaatsen.length &&
        // Wanneer de twee originele pleken allemaal onderdeel zijn van de toewijzing, ook niet tonen, dan is het namelijk een uitbreiding
        ondernemer.plaatsen.some(r => toewijzingVph.plaatsen.includes(r))
    ) {
        return true;
    } else {
        return false;
    }

};

export const convertSollicitatieToOndernemer = (data: MMSollicitatieStandalone): IMarktondernemer => {
    const {
        koopman: { erkenningsnummer },
        sollicitatieNummer,
        status,
        markt,
    } = data;

    return {
        description: formatOndernemerName(data.koopman),
        erkenningsNummer: erkenningsnummer,
        plaatsen: data.vastePlaatsen,
        voorkeur: {
            marktId: String(markt.id),
            erkenningsNummer: erkenningsnummer,
            maximum: Math.max(1, (data.vastePlaatsen || []).length),
        },
        sollicitatieNummer,
        status,
    };
};

export const getOndernemersByMarkt = (marktId: string) =>
    getMarktondernemersByMarktMM(marktId).then(ondernemers =>
        ondernemers.filter(ondernemer => !ondernemer.doorgehaald).map(convertSollicitatieToOndernemer)
    );

export const getOndernemersLangdurigAfgemeldByMarkt = (marktId: string) => {
    return Promise.all([
        getVoorkeurenAbsentByMarkt(marktId),
        getOndernemersByMarkt(marktId)
    ])
    .then( ([voorkeuren, ondernemers]) => {
        const voorkeurenFiltered = voorkeuren.filter( voorkeur => {
            const until = new Date(voorkeur.absentUntil);
            const todayNow = new Date(today());
            return +until >= +todayNow;
        });
        const ondernemersAbsentErkenningsnummers = voorkeurenFiltered.map( (voorkeur: any) => voorkeur.erkenningsNummer);
        const ondenemersAbsent = ondernemers.filter( ondernemer =>
            ondernemersAbsentErkenningsnummers.includes(ondernemer.erkenningsNummer)
        );
        return ondenemersAbsent.map(ondernemer => {
            ondernemer.voorkeur = voorkeuren.find(voorkeur =>
                voorkeur.erkenningsNummer === ondernemer.erkenningsNummer
            );
            return ondernemer;
        });
    });
};

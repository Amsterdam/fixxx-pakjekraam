import { getMarktondernemersByMarkt as getMarktondernemersByMarktMM } from '../makkelijkemarkt-api';
import {
    IMarktondernemer,
    IRSVP,
    IToewijzing,
} from '../markt.model';

import { MMSollicitatieStandalone } from '../makkelijkemarkt.model';
import { formatOndernemerName } from '../domain-knowledge.js';


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

export const ondernemerIsAfgemeldPeriode = (ondernemer: IMarktondernemer, marktDate: Date): Boolean => {

    const { absentFrom = null, absentUntil = null } = ondernemer.voorkeur || {};
    if (
        absentFrom && absentUntil &&
        marktDate >= absentFrom &&
        marktDate <= absentUntil
    ) {
        return true;
    } else {
        return false;
    }

};

export const vphIsGewisseld = (ondernemer: IMarktondernemer, toewijzingen: IToewijzing[]): Boolean => {

    const toewijzingVph = toewijzingen.find( toewijzing => toewijzing.ondernemer.erkenningsNummer === ondernemer.erkenningsNummer );

    if (!toewijzingVph) {
        return false;
    }

    const toewijzingOpVastePlekken = toewijzingVph.plaatsen.filter( plaats => ondernemer.plaatsen.includes(plaats) );

    if ( toewijzingOpVastePlekken.length === 0 ) {
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

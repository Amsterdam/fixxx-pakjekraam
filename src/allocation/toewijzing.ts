import {
    IMarkt,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IToewijzing
} from '../markt.model';

import {
    flatten
} from '../util';

export default {
    create: (markt: IMarkt, plaats: IMarktplaats, ondernemer: IMarktondernemer): IToewijzing => {
        return {
            marktId          : markt.marktId,
            marktDate        : markt.marktDate,
            plaatsen         : [plaats.plaatsId],
            ondernemer,
            erkenningsNummer : ondernemer.erkenningsNummer
        };
    },

    remove: (indeling: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => {
        const { marktplaatsen, openPlaatsen, toewijzingen } = indeling;

        if (!toewijzingen.includes(toewijzing)) {
            return indeling;
        }

        const plaatsen = marktplaatsen.filter(plaats =>
            toewijzing.plaatsen.includes(plaats.plaatsId)
        );
        return {
            ...indeling,
            toewijzingen: toewijzingen.filter(t => t !== toewijzing),
            openPlaatsen: [...openPlaatsen, ...plaatsen]
        };
    },

    find: (indeling: IMarktindeling, ondernemer: IMarktondernemer) => {
        return indeling.toewijzingen.find(toewijzing =>
            toewijzing.erkenningsNummer === ondernemer.erkenningsNummer
        );
    },

    add: (indeling: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => {
        return {
            ...indeling,
            openPlaatsen: indeling.openPlaatsen.filter(plaats => !toewijzing.plaatsen.includes(plaats.plaatsId)),
            toewijzingen: [...indeling.toewijzingen, toewijzing]
        };
    },

    merge: (a: IToewijzing, b: IToewijzing): IToewijzing => {
        return {
            ...a,
            ...b,
            plaatsen: flatten(a.plaatsen, b.plaatsen)
        };
    }
};

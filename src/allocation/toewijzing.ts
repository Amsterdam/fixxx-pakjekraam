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

const Toewijzing = {
    add: (indeling: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => {
        return {
            ...indeling,
            openPlaatsen: indeling.openPlaatsen.filter(plaats => !toewijzing.plaatsen.includes(plaats.plaatsId)),
            toewijzingen: [...indeling.toewijzingen, toewijzing]
        };
    },

    create: (markt: IMarkt, plaats: IMarktplaats, ondernemer: IMarktondernemer): IToewijzing => {
        return {
            marktId          : markt.marktId,
            marktDate        : markt.marktDate,
            plaatsen         : [plaats.plaatsId],
            ondernemer,
            erkenningsNummer : ondernemer.erkenningsNummer
        };
    },

    find: (indeling: IMarktindeling, ondernemer: IMarktondernemer) => {
        return indeling.toewijzingen.find(toewijzing =>
            toewijzing.erkenningsNummer === ondernemer.erkenningsNummer
        );
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

    replace: (indeling: IMarktindeling, existingToewijzing: IToewijzing, newToewijzing: IToewijzing): IMarktindeling => {
        if (!existingToewijzing) {
            return Toewijzing.add(indeling, newToewijzing);
        }

        const index = indeling.toewijzingen.findIndex(({ erkenningsNummer }) =>
            erkenningsNummer === newToewijzing.ondernemer.erkenningsNummer
        );

        // Remove old toewijzing...
        indeling = Toewijzing.remove(indeling, existingToewijzing);
        // ... and insert new one in its location.
        indeling.toewijzingen.splice(index, 0, newToewijzing);
        indeling.openPlaatsen = indeling.openPlaatsen.filter(plaats =>
            !newToewijzing.plaatsen.includes(plaats.plaatsId)
        );

        return indeling;
    },

    merge: (a: IToewijzing, b: IToewijzing): IToewijzing => {
        return {
            ...a,
            ...b,
            plaatsen: flatten(a.plaatsen, b.plaatsen)
        };
    }
};

export default Toewijzing;

import {
    IMarkt,
    IMarktindeling,
    IMarktindelingSeed
} from './markt.model';

import {
    intersects
} from './util';

import Indeling from './allocation/indeling';
import Ondernemer from './allocation/ondernemer';

/*
 * https://decentrale.regelgeving.overheid.nl/cvdr/XHTMLoutput/Actueel/Amsterdam/396119.html#id1-3-2-2-3-4-5
 */

export const calcToewijzingen = (markt: IMarkt & IMarktindelingSeed): IMarktindeling => {
    let indeling = Indeling.init(markt);

    // Stap 1a: Deel vasteplaatshouders in
    // -----------------------------------
    indeling = indeling.toewijzingQueue
    .filter(ondernemer => {
        return Ondernemer.heeftVastePlaatsen(ondernemer) &&
              !Ondernemer.wantsToMove(indeling, ondernemer) &&
              !Indeling.hasToMove(indeling, ondernemer);
    })
    .reduce(Indeling.assignVastePlaatsen, indeling);

    // Stap 1b: Deel VPH in die willen verplaatsen
    // -------------------------------------------
    indeling = indeling.toewijzingQueue
    .filter(Ondernemer.heeftVastePlaatsen)
    .reduce(Indeling.assignVastePlaatsen, indeling);

    // Stap 2: Deel ondernemers met een verkoopinrichting in
    // -----------------------------------------------------
    indeling = indeling.toewijzingQueue
    .filter(Ondernemer.heeftEVI)
    .reduce((indeling, ondernemer) => {
        const plaatsen = indeling.openPlaatsen.filter(plaats => {
            const { verkoopinrichting = [] } = ondernemer.voorkeur || {};
            return intersects(plaats.verkoopinrichting, verkoopinrichting);
        });

        return Indeling.assignPlaats(indeling, ondernemer, plaatsen, 'ignore');
    }, indeling);

    // Stap 3: Deel branche ondernemers in
    // -----------------------------------
    indeling = indeling.toewijzingQueue
    .filter(Ondernemer.heeftBranche)
    .reduce((indeling, ondernemer) => {
        const { branches = [] } = ondernemer.voorkeur || {};
        const plaatsen = indeling.openPlaatsen.filter(plaats =>
            intersects(plaats.branches, branches)
        );

        return Indeling.assignPlaats(indeling, ondernemer, plaatsen, 'ignore');
    }, indeling);

    // Stap 4: Deel sollicitanten in
    // -----------------------------
    indeling = indeling.toewijzingQueue
    .reduce((indeling, ondernemer) => {
        return Indeling.assignPlaats(indeling, ondernemer, indeling.openPlaatsen);
    }, indeling);

    // Stap 5: Verwerk uitbreidingsvoorkeuren
    // --------------------------------------
    indeling = Indeling.performExpansion(indeling);

    // Stap 6: Probeer afwijzingen opnieuw
    // -----------------------------------
    // Soms komen er plaatsen vrij omdat iemands `minimum` niet verzadigd is. Probeer
    // eerder afgewezen ondernemers opnieuw in te delen omdat deze mogelijk passen op
    // de vrijgekomen plaatsen.
    /*indeling = indeling.afwijzingen
    .reduce((indeling, afwijzing) => {
        const { ondernemer } = afwijzing;
        return Indeling.assignPlaats(indeling, ondernemer, indeling.openPlaatsen);
    }, indeling);
    indeling = Indeling.performExpansion(indeling);*/

    return indeling;
};

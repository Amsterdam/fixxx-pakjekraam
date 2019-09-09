import {
    IMarkt,
    IMarktindeling,
    IMarktindelingSeed
} from './markt.model';

import {
    count,
    intersects
} from './util';

import Indeling from './allocation/indeling';
import Ondernemers from './allocation/ondernemers';
import Ondernemer from './allocation/ondernemer';
import Moving from './allocation/moving';

/*
 * https://decentrale.regelgeving.overheid.nl/cvdr/XHTMLoutput/Actueel/Amsterdam/396119.html#id1-3-2-2-3-4-5
 */

export const calcToewijzingen = (markt: IMarkt & IMarktindelingSeed): IMarktindeling => {
    const { marktplaatsen, ondernemers, voorkeuren } = markt;
    const { aanwezigheid, aLijst } = markt;

    const aanwezigen = ondernemers.filter(ondernemer => Indeling.isAanwezig(aanwezigheid, ondernemer));
    aanwezigen.sort((a, b) => Ondernemers.compare(a, b, aLijst));

    /*
     * De bij een herindeling gekozen marktplaats wordt verwerkt als de initiele voorkeur van de ondernemer.
     * Bij de dagindeling kan een andere voorkeur worden uitgesproken.
     */
    let indeling: IMarktindeling = {
        ...markt,
        toewijzingQueue: [...aanwezigen],
        expansionQueue: [],
        expansionIteration: 1,
        expansionLimit: Math.min(
            Number.isFinite(markt.expansionLimit) ? markt.expansionLimit : Infinity,
            markt.marktplaatsen.length
        ),
        afwijzingen: [],
        toewijzingen: [],
        openPlaatsen: [...marktplaatsen.filter(plaats => !plaats.inactive)],
        voorkeuren: [...voorkeuren]
    };

    /*
     * Stap 1:
     * Deel vasteplaatshouders in
     */
    const vphZonderVerplaatsing = indeling.toewijzingQueue.filter(ondernemer => {
        return Ondernemer.isVast(ondernemer) && !Ondernemer.wantsToMove(indeling, ondernemer);
    });
    indeling = vphZonderVerplaatsing.reduce(Indeling.assignVastePlaatsen, indeling);

    const vphMetVerplaatsing = indeling.toewijzingQueue.filter(Ondernemer.heeftVastePlaatsen);
    indeling = vphMetVerplaatsing.reduce(Indeling.assignVastePlaatsen, indeling);

    /*
     * Stap 3:
     * beperkt de indeling tot kramen met een bepaalde verkoopinrichting
     */
    const brancheOndernemers = indeling.toewijzingQueue.filter(ondernemer =>
        Ondernemer.isInBranche(indeling, ondernemer)
    );

    indeling = brancheOndernemers.reduce((indeling, ondernemer, index, ondernemers) => {
        const ondernemerBranchePlaatsen = indeling.openPlaatsen.filter(plaats =>
            intersects(plaats.branches, ondernemer.voorkeur && ondernemer.voorkeur.branches)
        );

        return Indeling.assignPlaats(indeling, ondernemer, ondernemerBranchePlaatsen, 'ignore');
    }, indeling);

    /*
     * Stap 4:
     * beperkt de indeling tot kramen met een toewijzingsbeperking (branche, eigen materieel)
     * en ondernemers met een bijbehorende eigenschap
     */
    const verkoopinrichtingOndernemers = indeling.toewijzingQueue.filter(ondernemer =>
        count(ondernemer.voorkeur && ondernemer.voorkeur.verkoopinrichting) > 0
    );

    indeling = verkoopinrichtingOndernemers.reduce((indeling, ondernemer, index, ondernemers) => {
        const plaatsen = indeling.openPlaatsen.filter(plaats => {
            const { verkoopinrichting = [] } = ondernemer.voorkeur || {};
            return intersects(plaats.verkoopinrichting, verkoopinrichting);
        });

        return Indeling.assignPlaats(indeling, ondernemer, plaatsen, 'ignore');
    }, indeling);

    /*
     * Stap 5:
     * Deel sollicitanten in
     */
    indeling = indeling.toewijzingQueue
    .filter(ondernemer => !Ondernemer.heeftVastePlaatsen(ondernemer))
    .reduce((indeling, ondernemer) => Indeling.assignPlaats(indeling, ondernemer, indeling.openPlaatsen), indeling);

    /*
     * Stap 6:
     * Verwerk verplaatsingsvoorkeuren voor niet-VPH
     */
    indeling = Moving.performFor(indeling, aLijst);

    /*
     * Stap 7:
     * Verwerk uitbreidingsvoorkeuren
     */
    indeling = Indeling.performExpansion(indeling);

    return indeling;
};

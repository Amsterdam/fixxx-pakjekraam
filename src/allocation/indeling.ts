import {
    IAfwijzingReason,
    IMarkt,
    IMarktindeling,
    IMarktindelingSeed,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IRSVP
} from '../markt.model';

import {
    intersection,
    intersects,
    sum
} from '../util';

import Markt from './markt';
import Ondernemer from './ondernemer';
import Ondernemers from './ondernemers';
import Toewijzing from './toewijzing';

const MARKET_FULL: IAfwijzingReason = {
    code: 1,
    message: 'Alle marktplaatsen zijn reeds ingedeeld'
};
const BRANCHE_FULL: IAfwijzingReason = {
    code: 2,
    message: 'Alle marktplaatsen voor deze branch zijn reeds ingedeeld'
};
const ADJACENT_UNAVAILABLE: IAfwijzingReason = {
    code: 3,
    message: 'Geen geschikte plaats(en) gevonden'
};
const MINIMUM_UNAVAILABLE: IAfwijzingReason = {
    code: 4,
    message: 'Minimum aantal plaatsen niet beschikbaar'
};

const Indeling = {
    init: (markt: IMarkt & IMarktindelingSeed): IMarktindeling => {
        const marktDate = new Date(markt.marktDate);
        if (!+marktDate) {
            throw Error('Invalid market date');
        }

        const openPlaatsen    = markt.marktplaatsen.filter(plaats => !plaats.inactive);
        const toewijzingQueue = markt.ondernemers
        .filter(ondernemer =>
            Indeling.isAanwezig(ondernemer, markt.aanwezigheid, new Date(markt.marktDate))
        )
        .sort((a, b) => Ondernemers.compare(a, b, markt.aLijst));
        const expansionLimit  = Math.min(
            Number.isFinite(markt.expansionLimit) ? markt.expansionLimit : Infinity,
            markt.marktplaatsen.length
        );

        return {
            ...markt,
            openPlaatsen,

            expansionQueue     : [],
            expansionIteration : 1,
            expansionLimit,

            toewijzingQueue,
            afwijzingen        : [],
            toewijzingen       : [],
            voorkeuren         : [...markt.voorkeuren]
        };
    },

    assignPlaats: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaatsen: IMarktplaats[],
        handleRejection: 'reject' | 'ignore' = 'reject',
        minimumSize?: number
    ): IMarktindeling => {
        try {
            if (indeling.openPlaatsen.length === 0) {
                throw MARKET_FULL;
            } else if (Ondernemer.isInMaxedOutBranche(indeling, ondernemer)) {
                throw BRANCHE_FULL;
            }

            if (!plaatsen || !plaatsen.length) {
                throw Error('assignPlaats vereist een set aan open plaatsen');
            }

            let bestePlaatsen;
            const strategy = Indeling.determineStrategy(indeling);
            if ((!minimumSize || minimumSize === 1) && strategy === 'optimistic') {
                const targetSize = Ondernemer.getTargetSize(ondernemer);
                const happySize  = Math.min(targetSize, 2);
                bestePlaatsen = Indeling._findBestePlaatsen(indeling, ondernemer, plaatsen, happySize);
            }
            if( !bestePlaatsen || !bestePlaatsen.length ) {
                bestePlaatsen = Indeling._findBestePlaatsen(indeling, ondernemer, plaatsen, minimumSize);
            }

            if (!bestePlaatsen.length) {
                throw ADJACENT_UNAVAILABLE;
            }

            return bestePlaatsen.reduce((indeling, plaats) => {
                return Toewijzing.add(indeling, ondernemer, plaats);
            }, indeling);
        } catch (errorMessage) {
            return handleRejection === 'reject' ?
                   Indeling._rejectOndernemer(indeling, ondernemer, errorMessage) :
                   indeling;
        }
    },

    assignVastePlaatsen: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): IMarktindeling => {
        const strategy   = Indeling.determineStrategy(indeling);
        const startSize  = Ondernemer.getStartSize(ondernemer);
        // const { anywhere = false } = ondernemer.voorkeur || {};
        const anywhere   = false;

        let bestePlaatsen;
        if (startSize === 1 && strategy === 'optimistic') {
            const targetSize = Ondernemer.getTargetSize(ondernemer);
            const happySize  = Math.min(targetSize, 2);
            bestePlaatsen = Indeling._findBestePlaatsenForVPH(indeling, ondernemer, happySize);
        }
        if (!bestePlaatsen || !bestePlaatsen.length) {
            bestePlaatsen = Indeling._findBestePlaatsenForVPH(indeling, ondernemer, startSize);
        }

        if (bestePlaatsen.length) {
            return bestePlaatsen.reduce((indeling, plaats) => {
                return Toewijzing.add(indeling, ondernemer, plaats);
            }, indeling);
        } else if (anywhere) {
            // TODO: Momenteel onbereikbare code — nog onbekend wat er moet gebeuren met
            //       flexibel indelen voor VPH.
            return Indeling.assignPlaats(indeling, ondernemer, indeling.openPlaatsen, 'reject', startSize);
        } else {
            return Indeling._rejectOndernemer(indeling, ondernemer, ADJACENT_UNAVAILABLE);
        }
    },

    canBeAssignedTo: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaats: IMarktplaats
    ): boolean => {
        const { anywhere = true }  = ondernemer.voorkeur || {};
        const voorkeuren           = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const voorkeurIds          = voorkeuren.map(({ plaatsId }) => plaatsId);
        const ondernemerBranches   = Ondernemer.getBranches(indeling, ondernemer);
        const verplichteBrancheIds = ondernemerBranches
                                    .filter(({ verplicht = false }) => verplicht)
                                    .map(({ brancheId }) => brancheId);

        return !(
            // Ondernemer is in verplichte branche, maar plaats voldoet daar niet aan.
            verplichteBrancheIds.length && !intersects(verplichteBrancheIds, plaats.branches) ||
            // Ondernemer heeft een EVI, maar de plaats is hier niet geschikt voor.
            Ondernemer.heeftEVI(ondernemer) && !plaats.verkoopinrichting ||
            // Ondernemer wil niet willekeurig ingedeeld worden en plaats is geen voorkeur.
            !anywhere && !voorkeurIds.includes(plaats.plaatsId) ||
            // Marktplaats is niet beschikbaar
            !Indeling._isAvailable(indeling, plaats)
        );
    },

    determineStrategy: (
        indeling: IMarktindeling
    ): 'optimistic' | 'conservative' => {
        const minRequired = indeling.toewijzingQueue.reduce((sum, ondernemer) => {
            const startSize  = Ondernemer.getStartSize(ondernemer);
            const targetSize = Ondernemer.getTargetSize(ondernemer);
            const happySize  = Ondernemer.isVast(ondernemer) && startSize >= 2 ?
                               startSize :
                               Math.min(targetSize, 2);

            return sum + happySize;
        }, 0);

        return indeling.openPlaatsen.length >= minRequired ?
               'optimistic' :
               'conservative';
    },

    // Als niet alle vaste plaatsen van een VPH beschikbaar zijn zal hij
    // moeten verplaatsen. Voor de berekening beschouwing we deze ondernemer
    // als iemand die verplaatst.
    hasToMove: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): boolean => {
        const vastePlaatsen = Ondernemer.getVastePlaatsen(indeling, ondernemer);
        const beschikbaar = vastePlaatsen.filter(plaats => Indeling._isAvailable(indeling, plaats));
        return beschikbaar.length < vastePlaatsen.length;
    },

    isAanwezig: (
        ondernemer: IMarktondernemer,
        aanmeldingen: IRSVP[],
        marktDate: Date
    ) => {
        const { absentFrom = null, absentUntil = null } = ondernemer.voorkeur || {};
        if (
            absentFrom && absentUntil &&
            marktDate >= new Date(absentFrom) &&
            marktDate <= new Date(absentUntil)
        ) {
            return false;
        }

        const rsvp = aanmeldingen.find(({ erkenningsNummer }) =>
            erkenningsNummer === ondernemer.erkenningsNummer
        );
        // Bij de indeling van VPHs worden alleen expliciete afmeldingen in beschouwing
        // genomen. Anders wordt een VPH automatisch als aangemeld beschouwd.
        return Ondernemer.isVast(ondernemer) ?
               !rsvp || !!rsvp.attending || rsvp.attending === null :
               !!rsvp && !!rsvp.attending;
    },

    performExpansion: (
        indeling: IMarktindeling
    ): IMarktindeling => {
        let queue = indeling.toewijzingen.filter(toewijzing =>
            Ondernemer.wantsExpansion(toewijzing)
        );

        indeling = { ...indeling, expansionIteration: 1 };

        while (
            indeling.openPlaatsen.length &&
            queue.length &&
            indeling.expansionIteration <= indeling.expansionLimit
        ) {
            queue = queue.reduce((newQueue, toewijzing) => {
                const { ondernemer } = toewijzing;

                if (Ondernemer.canExpandInIteration(indeling, toewijzing)) {
                    const plaatsFilter = (plaats: IMarktplaats): boolean => {
                        return Indeling.canBeAssignedTo(indeling, ondernemer, plaats);
                    };
                    const openAdjacent = Markt.getAdjacentPlaatsen(indeling, toewijzing.plaatsen, 1, plaatsFilter);
                    const [uitbreidingPlaats] = Indeling._findBestePlaatsen(indeling, ondernemer, openAdjacent);

                    if (uitbreidingPlaats) {
                        indeling   = Toewijzing.add(indeling, ondernemer, uitbreidingPlaats);
                        toewijzing = Toewijzing.find(indeling, ondernemer);
                    }
                }

                if (Ondernemer.wantsExpansion(toewijzing)) {
                    newQueue.push(toewijzing);
                }

                return newQueue;
            }, []);

            indeling.expansionIteration++;
        }

        // The people still in the queue have fewer places than desired. Check if they
        // must be rejected because of their `minimum` setting.
        return queue.reduce((indeling, { ondernemer, plaatsen }) => {
            const { minimum = 0 } = ondernemer.voorkeur || {};
            return minimum > plaatsen.length ?
                   Indeling._rejectOndernemer(indeling, ondernemer, MINIMUM_UNAVAILABLE) :
                   indeling;
        }, indeling);
    },

    _findBestGroup: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        groups: IPlaatsvoorkeur[][],
        size: number = 1,
        filter?: (plaats: IMarktplaats) => boolean,
        compare?: (best: IPlaatsvoorkeur[], current: IPlaatsvoorkeur[]) => number
    ): IMarktplaats[] => {
        return groups.reduce((result, group) => {
            if (group.length < size) {
                const depth     = size - group.length;
                const plaatsIds = group.map(({ plaatsId }) => plaatsId);
                const extra     = Markt.getAdjacentPlaatsen(indeling, plaatsIds, depth, filter);
                group = group.concat(<IPlaatsvoorkeur[]> extra);
                // Zet de zojuist toegevoegde plaatsen op de juiste plek.
                group = Markt.groupByAdjacent(indeling, group)[0];
            }

            if (group.length >= size) {
                // Stop `reduce` loop.
                groups.length = 0;
                // Reduceer het aantal plaatsen tot `size`.
                // Pak de subset met de hoogste totale prioriteit.
                return group.reduce((best, plaats, index) => {
                    const current = group.slice(index, index+size);
                    return (!best.length || compare(best, current) < 0) ?
                           current :
                           best;
                }, []);
            } else {
                return result;
            }
        }, []);
    },

    _findBestePlaatsen: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        openPlaatsen: IMarktplaats[],
        size: number = 1
    ): IMarktplaats[] => {
        const voorkeuren           = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const ondernemerBranches   = Ondernemer.getBranches(indeling, ondernemer);

        const plaatsFilter = (plaats: IMarktplaats): boolean => {
            return Indeling.canBeAssignedTo(indeling, ondernemer, plaats);
        };

        // 1. Converteer geschikte plaatsen naar IPlaatsvoorkeur (zodat elke optie
        //    een `priority` heeft).
        // 2. Sorteer op branche overlap en `priority`.
        const plaatsen = <IPlaatsvoorkeur[]> openPlaatsen
        .map(plaats => {
            const { priority = 0 } = voorkeuren.find(({ plaatsId }) => plaatsId === plaats.plaatsId) || {};
            return { ...plaats, priority };
        })
        .sort((a, b) =>
            intersection(b.branches, ondernemerBranches).length -
            intersection(a.branches, ondernemerBranches).length
            ||
            b.priority - a.priority
        );
        // 3. Maak groepen van de plaatsen waar deze ondernemer kan staan (Zie `plaatsFilter`)
        const groups = Markt.groupByAdjacent(indeling, plaatsen, plaatsFilter);
        // 4. Geef de meest geschikte groep terug.
        return Indeling._findBestGroup(
            indeling,
            ondernemer,
            groups,
            size,
            plaatsFilter,
            (best, current) => {
                // TODO: Kijkt enkel naar `priority`, maar branche overlap is belangrijker.
                const bestScore = best.map(({ priority }) => priority).reduce(sum, 0);
                const curScore  = current.map(({ priority }) => priority).reduce(sum, 0);
                return bestScore - curScore;
            }
        );
    },

    _findBestePlaatsenForVPH: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        size: number = 1
    ): IMarktplaats[] => {
        const plaatsFilter = (plaats: IMarktplaats): boolean => {
            return Indeling.canBeAssignedTo(indeling, ondernemer, plaats);
        };
        const voorkeuren   = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const groups       = Markt.groupByAdjacent(indeling, voorkeuren, plaatsFilter);

        return Indeling._findBestGroup(
            indeling,
            ondernemer,
            groups,
            size,
            plaatsFilter,
            (best, current) => {
                const bestScore = best.map(({ priority }) => priority).reduce(sum, 0);
                const curScore  = current.map(({ priority }) => priority).reduce(sum, 0);
                return bestScore - curScore;
            }
        );
    },

    _isAvailable: (
        indeling: IMarktindeling,
        plaats: IMarktplaats
    ): boolean => {
        return !!~indeling.openPlaatsen.findIndex(({ plaatsId }) =>
            plaatsId === plaats.plaatsId
        );
    },

    _rejectOndernemer: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        reason: IAfwijzingReason
    ): IMarktindeling => {
        indeling = Toewijzing.remove(indeling, ondernemer);

        const afwijzing = indeling.afwijzingen.find(({ erkenningsNummer }) =>
            erkenningsNummer === ondernemer.erkenningsNummer
        );
        if( !afwijzing ) {
            indeling.afwijzingen = indeling.afwijzingen.concat({
                marktId          : indeling.marktId,
                marktDate        : indeling.marktDate,
                erkenningsNummer : ondernemer.erkenningsNummer,
                reason,
                ondernemer
            });
        }

        return indeling;
    }
};

export default Indeling;

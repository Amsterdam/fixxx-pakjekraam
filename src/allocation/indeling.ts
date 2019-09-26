import {
    IAfwijzingReason,
    IBranche,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IRSVP,
    PlaatsId
} from '../markt.model';

import {
    intersection,
    intersects,
    sum
} from '../util';

import Markt from './markt';
import Ondernemer from './ondernemer';
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

// `voorkeuren` should always be sorted by priority DESC, because we're using its array
// indices to sort by priority. See `Ondernemer.getPlaatsVoorkeuren()`.
const plaatsVoorkeurCompare = (plaatsA: IMarktplaats, plaatsB: IMarktplaats, voorkeuren: IPlaatsvoorkeur[]): number => {
    const max = voorkeuren.length;
    const a   = voorkeuren.findIndex(({ plaatsId }) => plaatsId === plaatsA.plaatsId);
    const b   = voorkeuren.findIndex(({ plaatsId }) => plaatsId === plaatsB.plaatsId);
    // ~-1 == 0, so we can kick a or b to EOL if it's not found.
    return (~a ? a : max) - (~b ? b : max);
};
// Sort DESC on branche overlap with provided `branches` array. The more overlap, the better.
const brancheCompare = (a: IMarktplaats, b: IMarktplaats, branches: IBranche[]): number => {
    return intersection(b.branches, branches).length -
           intersection(a.branches, branches).length;
};

const Indeling = {
    assignPlaats: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaatsen: IMarktplaats[],
        handleRejection: 'reject' | 'ignore' = 'reject',
        maximum: number = 1
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

            const bestePlaatsen = Indeling.findBestePlaatsen(indeling, ondernemer, plaatsen, maximum);
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
        const available   = Indeling.findBestePlaatsenForVPH(indeling, ondernemer);
        // const { anywhere  = false } = ondernemer.voorkeur || {};
        // const startSize   = Ondernemer.getStartSize(ondernemer);
        const minimumSize = Ondernemer.getMinimumSize(ondernemer);

        if (available.length && available.length >= minimumSize) {
            return available.reduce((indeling, plaats) => {
                return Toewijzing.add(indeling, ondernemer, plaats);
            }, indeling);
        } else /*if (anywhere)*/ {
            /*const openPlaatsen = indeling.openPlaatsen.filter(plaats =>
                Indeling._isAvailable(indeling, plaats)
            );
            return Indeling.assignPlaats(indeling, ondernemer, openPlaatsen, 'reject', startSize);
        } else {*/
            return Indeling._rejectOndernemer(indeling, ondernemer, ADJACENT_UNAVAILABLE);
        }
    },

    findBestePlaatsen: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        openPlaatsen: IMarktplaats[],
        maximum: number = 1
    ) => {
        const expansionSize        = maximum - 1;
        const voorkeuren           = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const ondernemerBranches   = Ondernemer.getBranches(indeling, ondernemer);

        const { anywhere = true }  = ondernemer.voorkeur || {};
        const voorkeurIds          = voorkeuren.map(({ plaatsId }) => plaatsId);
        const verplichteBrancheIds = ondernemerBranches
                                    .filter(({ verplicht = false }) => verplicht)
                                    .map(({ brancheId }) => brancheId);

        const mogelijkePlaatsen = openPlaatsen.filter(({ plaatsId, branches = [] }) => {
            if (
                // Ondernemer is in verplichte branche, maar plaats voldoet daar niet aan.
                verplichteBrancheIds.length && !intersects(verplichteBrancheIds, branches) ||
                // Ondernemer wil niet willekeurig ingedeeld worden en plaats staat niet in voorkeuren.
                !anywhere && !voorkeurIds.includes(plaatsId) ||
                // Niet genoeg vrije aansluitende plaatsen om maximum te verzadigen.
                Indeling._getAvailableAdjacentFor(indeling, [plaatsId], expansionSize).length < expansionSize
            ) {
                return false;
            } else {
                return true;
            }
        });

        // Sorteer plaatsen op voorkeursprioriteit, daarna op overlap in ondernemersbranches.
        return mogelijkePlaatsen
        .sort((a, b) => {
            return plaatsVoorkeurCompare(a, b, voorkeuren) ||
                   brancheCompare(a, b, ondernemerBranches);
        })
        .slice(0, maximum);
    },

    findBestePlaatsenForVPH: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): IMarktplaats[] => {
        const wantsToMove = Ondernemer.wantsToMove(indeling, ondernemer);
        const startSize   = Ondernemer.getStartSize(ondernemer);
        const voorkeuren  = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const available   = voorkeuren.filter(plaats =>
            Indeling._isAvailable(indeling, plaats)
        );
        const grouped     = Markt.groupByAdjacent(indeling, available);

        return grouped.reduce((result, group) => {
            if (wantsToMove && result.length) {
                return result;
            }

            if (group.length < startSize) {
                const depth     = startSize - group.length;
                const plaatsIds = group.map(({ plaatsId }) => plaatsId);
                const extra     = Indeling._getAvailableAdjacentFor(indeling, plaatsIds, depth);
                group = group.concat(<IPlaatsvoorkeur[]> extra);
                // group = Markt.groupByAdjacent(indeling, group)[0];
            }

            if (
                !wantsToMove && group.length > result.length ||
                group.length >= startSize
            ) {
                // Reduceer het aantal plaatsen tot `startSize`, maar pak de subset
                // waar de plaats met de hoogste prioriteit in zit.
                return group.reduce((best, plaats, index) => {
                    const current = group.slice(index, index+startSize);
                    const bestSum = best.map(({ priority }) => priority).reduce(sum, 0);
                    const curSum  = current.map(({ priority }) => priority).reduce(sum, 0);
                    return !best.length || curSum > bestSum ? current : best;
                }, []);
            } else {
                return result;
            }
        }, []);
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

        // Als een ondernemer (of marktmeester) zijn afwezigheid heeft ingevuld
        if ( Boolean(ondernemer.voorkeur.absentFrom) && Boolean(ondernemer.voorkeur.absentUntil) ) {
            const absentFrom = new Date(ondernemer.voorkeur.absentFrom);
            const absentUntil = new Date(ondernemer.voorkeur.absentUntil);
            // En de marktdatum valt binnen de afwezig vanaf en afwezig tot, geeft de functie false terug
            if (marktDate >= absentFrom && marktDate <= absentUntil) {
                console.log(`${ondernemer.description} is voor langere tijd afwezig`);
                return false;
            }
        }

        const rsvp = aanmeldingen.find(aanmelding =>
            aanmelding.erkenningsNummer === ondernemer.erkenningsNummer
        );

        // Vasteplaatshouders die niets hebben laten weten en die hebben bevestigd dat ze
        // komen worden meegeteld als aanwezig. Alleen de expliciete afmeldingen worden
        // niet in overweging genomen in de indeling van kramen.
        if (ondernemer.status === 'vpl') {
            return !rsvp || !!rsvp.attending || rsvp.attending === null;
        } else {
            return !!rsvp && !!rsvp.attending;
        }

    },

    performExpansion: (
        indeling: IMarktindeling
    ): IMarktindeling => {
        let queue = indeling.toewijzingen.filter(toewijzing =>
            Ondernemer.wantsExpansion(toewijzing)
        );

        while (
            indeling.openPlaatsen.length && queue.length &&
            indeling.expansionIteration <= indeling.expansionLimit
        ) {
            queue = queue.reduce((newQueue, toewijzing) => {
                const { ondernemer } = toewijzing;

                if (Ondernemer.canExpandInIteration(indeling, toewijzing)) {
                    const openAdjacent        = Indeling._getAvailableAdjacentFor(indeling, toewijzing.plaatsen, 1);
                    const [uitbreidingPlaats] = Indeling.findBestePlaatsen(indeling, ondernemer, openAdjacent);

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

    _getAvailableAdjacentFor: (
        indeling: IMarktindeling,
        plaatsIds: PlaatsId[],
        depth: number = 1
    ): IMarktplaats[] => {
        return Markt.getAdjacentPlaatsen(indeling, plaatsIds, depth, (plaats) =>
            Indeling._isAvailable(indeling, plaats)
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
        return {
            ...Toewijzing.remove(indeling, ondernemer),
            afwijzingen: indeling.afwijzingen.concat({
                marktId          : indeling.marktId,
                marktDate        : indeling.marktDate,
                erkenningsNummer : ondernemer.erkenningsNummer,
                reason,
                ondernemer
            })
        };
    }
};

export default Indeling;

import {
    IAfwijzingReason,
    IBranche,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IRSVP,
    IToewijzing
} from '../markt.model';

import {
    intersection
} from '../util';

import Markt from './markt';
import Ondernemer from './ondernemer';
import Toewijzing from './toewijzing';

const FULL_REASON: IAfwijzingReason = {
    code: 1,
    message: 'Alle marktplaatsen zijn reeds ingedeeld'
};
const BRANCHE_FULL_REASON: IAfwijzingReason = {
    code: 2,
    message: 'Alle marktplaatsen voor deze branch zijn reeds ingedeeld'
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
                throw FULL_REASON;
            } else if (Ondernemer.isInMaxedOutBranche(indeling, ondernemer)) {
                throw BRANCHE_FULL_REASON;
            }

            const mogelijkePlaatsen = plaatsen || indeling.openPlaatsen;
            const bestePlaatsen = Indeling.findBestePlaatsen(indeling, ondernemer, mogelijkePlaatsen, maximum);
            if (!bestePlaatsen.length) {
                throw 'Geen plaats(en) gevonden';
            }

            return bestePlaatsen.reduce((indeling, plaats) => {
                return Indeling._assignPlaats(indeling, ondernemer, plaats, 'merge');
            }, indeling);
        } catch (errorMessage) {
            return handleRejection === 'reject' ?
                   Indeling._rejectOndernemer(indeling, ondernemer, errorMessage) :
                   indeling;
        }
    },

    assignVastePlaatsen: (indeling: IMarktindeling, ondernemer: IMarktondernemer): IMarktindeling => {
        const beschikbaar = Indeling.getAvailablePlaatsenForVPH(indeling, ondernemer);

        if (beschikbaar.length === 0) {
            const minimum = Ondernemer.getMinimumSize(ondernemer);
            return Indeling.assignPlaats(indeling, ondernemer, null, 'reject', minimum);
        } else {
            const { plaatsen = [] } = ondernemer;
            const { maximum = Infinity } = ondernemer.voorkeur || {};
            const maxPlaatsen = Math.min(maximum, beschikbaar.length, plaatsen.length);

            return beschikbaar
            .slice(0, maxPlaatsen)
            .reduce((indeling, plaats) => {
                return Indeling._assignPlaats(indeling, ondernemer, plaats, 'merge');
            }, indeling);
        }
    },

    findBestePlaatsen: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        openPlaatsen: IMarktplaats[],
        maximum: number = 1
    ) => {
        let mogelijkePlaatsen = openPlaatsen;

        const ondernemerBranches = Ondernemer.getBranches(indeling, ondernemer);
        const voorkeuren = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);

        mogelijkePlaatsen = ondernemerBranches.reduce(
            (mogelijkePlaatsen: IMarktplaats[], branche: IBranche): IMarktplaats[] => {
                if (branche.verplicht) {
                    // Bijvoorbeeld: als een ondernemer wil frituren (`{ "branche": "bak" }`)
                    // dan blijven alleen nog de kramen over waarop frituren is toegestaan.
                    mogelijkePlaatsen = mogelijkePlaatsen.filter(
                        plaats => plaats.branches && plaats.branches.find(brancheId => brancheId === branche.brancheId)
                    );
                } else {
                    // Een groenteboer wordt bij voorkeur geplaatst op een plaats in de branch AGF.
                    mogelijkePlaatsen = [...mogelijkePlaatsen].sort((a, b) => {
                        if (a.branches && a.branches.includes(branche.brancheId)) {
                            return -1;
                        } else if (b.branches && b.branches.includes(branche.brancheId)) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                }

                return mogelijkePlaatsen;
            },
            mogelijkePlaatsen
        );

        if (ondernemer.voorkeur && ondernemer.voorkeur.anywhere === false) {
            const voorkeurIds = voorkeuren.map(({ plaatsId }) => plaatsId);
            mogelijkePlaatsen = mogelijkePlaatsen.filter(({ plaatsId }) => voorkeurIds.includes(plaatsId));
        }

        mogelijkePlaatsen.sort((a, b) => plaatsVoorkeurCompare(a, b, voorkeuren));

        if (maximum > 1) {
            mogelijkePlaatsen = mogelijkePlaatsen.filter(p => {
                const expansionSize = maximum - 1;
                const adjacent = Markt.getAdjacentPlaatsen(indeling, [p.plaatsId], expansionSize);

                return adjacent.length >= expansionSize;
            });
        }

        return mogelijkePlaatsen.slice(0, maximum);
    },

    generateExpansionQueue: (indeling: IMarktindeling): IMarktindeling => {
        const queue = indeling.toewijzingen.filter(({ ondernemer }) => {
            return Ondernemer.wantsExpansion(indeling, ondernemer);
        });
        return {
            ...indeling,
            expansionQueue: queue
        };
    },

    getAvailablePlaatsenForVPH: (indeling: IMarktindeling, ondernemer: IMarktondernemer): IMarktplaats[] => {
        // Verwerk verplaatsingsvoorkeuren enkel als de ondernemer ook wil verplaatsen.
        // Een VPH met 2 plaatsen die maar 1 verplaatsingsvoorkeur opgeeft wordt niet
        // beschouwd als iemand die wil verplaatsen. De voorkeursplaats wordt in dit geval
        // dan ook genegeerd.
        //
        // Tevens, als er niet genoeg voorkeuren vrij zijn om het gewenste aantal kramen te
        // kunnen verplaatsen worden de resterende voorkeursplaatsen ook genegeerd.
        let plaatsen;
        const vastePlaatsen = Ondernemer.getVastePlaatsen(indeling, ondernemer);

        if (!Ondernemer.wantsToMove(indeling, ondernemer)) {
            plaatsen = vastePlaatsen;
        } else {
            const availableVoorkeuren = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer, false).filter(voorkeur =>
                ~indeling.openPlaatsen.findIndex(({ plaatsId }) => plaatsId === voorkeur.plaatsId)
            );
            plaatsen = availableVoorkeuren.length >= vastePlaatsen.length ?
                       Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer) :
                       vastePlaatsen;
        }

        return plaatsen.filter(plaats =>
            ~indeling.openPlaatsen.findIndex(({ plaatsId }) => plaatsId === plaats.plaatsId)
        );
    },

    isAanwezig: (aanwezigheid: IRSVP[], ondernemer: IMarktondernemer) => {
        const rsvp = aanwezigheid.find(aanmelding => aanmelding.erkenningsNummer === ondernemer.erkenningsNummer);

        // Vasteplaatshouders die niets hebben laten weten en die hebben bevestigd dat ze
        // komen worden meegeteld als aanwezig. Alleen de expliciete afmeldingen worden
        // niet in overweging genomen in de indeling van kramen.
        if (ondernemer.status === 'vpl') {
            return !rsvp || !!rsvp.attending || rsvp.attending === null;
        } else {
            return !!rsvp && !!rsvp.attending;
        }
    },

    processExpansionQueue: (indeling: IMarktindeling): IMarktindeling => {
        while (indeling.expansionIteration <= indeling.expansionLimit) {
            // TODO: Remove items from expansion queue for which expansion was impossible,
            // skip those in the next iteration.

            indeling = indeling.expansionQueue
            .filter(toewijzing => {
                const { ondernemer, plaatsen } = toewijzing;
                const currentSize = plaatsen.length;
                const targetSize  = Ondernemer.getTargetSize(ondernemer);
                const maxSize     = Math.min(targetSize, indeling.expansionIteration, indeling.expansionLimit);

                return currentSize < maxSize &&
                       !Ondernemer.isInMaxedOutBranche(indeling, ondernemer);
            })
            .reduce(Indeling._assignExpansion, indeling);

            indeling.expansionIteration++;
        }

        return indeling;
    },

    _assignExpansion: (indeling: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => {
        const { ondernemer, plaatsen } = toewijzing;
        const targetSize = Ondernemer.getTargetSize(ondernemer);
        const currentSize = plaatsen.length;

        if (currentSize >= targetSize) {
            return indeling;
        }

        const adjacent = Markt.getAdjacentPlaatsen(indeling, plaatsen, 1);
        const openAdjacent = intersection(adjacent, indeling.openPlaatsen);
        const [uitbreidingPlaats] = Indeling.findBestePlaatsen(indeling, ondernemer, openAdjacent);

        if (!uitbreidingPlaats) {
            return Indeling._removeFromExpansionQueue(indeling, toewijzing);
        }

        // Remove vrije plaats
        indeling = {
            ...indeling,
            openPlaatsen: indeling.openPlaatsen.filter(plaats => plaats.plaatsId !== uitbreidingPlaats.plaatsId)
        };

        const uitbreiding = {
            ...toewijzing,
            plaatsen: [...toewijzing.plaatsen, uitbreidingPlaats.plaatsId]
        };

        // TODO: Merge `toewijzing` and `uitbreiding` objects, add to `indeling`
        indeling = Toewijzing.replace(indeling, toewijzing, uitbreiding);
        return currentSize + 1 < targetSize ?
               Indeling._replaceInExpansionQueue(indeling, toewijzing, uitbreiding) :
               Indeling._removeFromExpansionQueue(indeling, toewijzing);
    },

    _assignPlaats: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaats: IMarktplaats,
        conflictResolution: 'merge' | 'reassign' | 'keep-both' = 'keep-both'
    ): IMarktindeling => {
        const { erkenningsNummer } = ondernemer;
        const existingToewijzing = Toewijzing.find(indeling, ondernemer);
        let newToewijzing = Toewijzing.create(indeling, plaats, ondernemer);

        if (existingToewijzing) {
            if (conflictResolution === 'merge') {
                newToewijzing = Toewijzing.merge(existingToewijzing, newToewijzing);
            }
            if (conflictResolution !== 'keep-both') {
                indeling = Toewijzing.remove(indeling, existingToewijzing);
            }
        }

        indeling = Toewijzing.add(indeling, newToewijzing);

        return {
            ...indeling,
            toewijzingQueue: indeling.toewijzingQueue.filter(ondernemer =>
                ondernemer.erkenningsNummer !== erkenningsNummer
            )
        };
    },

    _rejectOndernemer: (indeling: IMarktindeling, ondernemer: IMarktondernemer, reason: IAfwijzingReason): IMarktindeling => {
        const { erkenningsNummer } = ondernemer;
        const afwijzingen = indeling.afwijzingen.concat({
            marktId          : indeling.marktId,
            marktDate        : indeling.marktDate,
            erkenningsNummer : ondernemer.erkenningsNummer,
            reason,
            ondernemer
        });

        return {
            ...indeling,
            afwijzingen,
            toewijzingQueue: indeling.toewijzingQueue.filter(ondernemer =>
                ondernemer.erkenningsNummer !== erkenningsNummer
            )
        };
    },

    _removeFromExpansionQueue: (indeling: IMarktindeling, toewijzing: IToewijzing) => {
        return {
            ...indeling,
            expansionQueue: (indeling.expansionQueue || []).filter(t => t !== toewijzing)
        };
    },

    _replaceInExpansionQueue: (indeling: IMarktindeling, current: IToewijzing, replacement: IToewijzing) => {
        return {
            ...indeling,
            expansionQueue: indeling.expansionQueue.map(item => (item === current ? replacement : item))
        };
    }
};

export default Indeling;

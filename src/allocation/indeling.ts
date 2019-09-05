import {
    IAfwijzingReason,
    IBranche,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IRSVP
} from '../markt.model';

import {
    intersection
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

            const mogelijkePlaatsen = plaatsen || indeling.openPlaatsen;
            const bestePlaatsen = Indeling.findBestePlaatsen(indeling, ondernemer, mogelijkePlaatsen, maximum);
            if (!bestePlaatsen.length) {
                throw ADJACENT_UNAVAILABLE;
            }

            return bestePlaatsen.reduce((indeling, plaats) => {
                return Indeling._assignPlaats(indeling, ondernemer, plaats);
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
                return Indeling._assignPlaats(indeling, ondernemer, plaats);
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
        const minimum       = Ondernemer.getMinimumSize(ondernemer);

        if (!Ondernemer.wantsToMove(indeling, ondernemer)) {
            plaatsen = vastePlaatsen;
        } else {
            const availableVoorkeuren = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer, false).filter(voorkeur =>
                ~indeling.openPlaatsen.findIndex(({ plaatsId }) => plaatsId === voorkeur.plaatsId)
            );
            plaatsen = availableVoorkeuren.length >= Math.min(minimum, vastePlaatsen.length) ?
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

    performExpansion: (indeling: IMarktindeling): IMarktindeling => {
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
                    const adjacent            = Markt.getAdjacentPlaatsen(indeling, toewijzing.plaatsen, 1);
                    const openAdjacent        = intersection(adjacent, indeling.openPlaatsen);
                    const [uitbreidingPlaats] = Indeling.findBestePlaatsen(indeling, ondernemer, openAdjacent);

                    if (uitbreidingPlaats) {
                        indeling   = Indeling._assignPlaats(indeling, ondernemer, uitbreidingPlaats);
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

    _assignPlaats: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaats: IMarktplaats
    ): IMarktindeling => {
        const existingToewijzing = Toewijzing.find(indeling, ondernemer);
        let newToewijzing = Toewijzing.create(indeling, plaats, ondernemer);

        if (existingToewijzing) {
            newToewijzing = Toewijzing.merge(existingToewijzing, newToewijzing);
        }

        indeling = Toewijzing.replace(indeling, existingToewijzing, newToewijzing);

        return {
            ...indeling,
            toewijzingQueue: indeling.toewijzingQueue.filter(({ erkenningsNummer }) =>
                erkenningsNummer !== ondernemer.erkenningsNummer
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

        const toewijzing = Toewijzing.find(indeling, ondernemer);
        if (toewijzing) {
            indeling = Toewijzing.remove(indeling, toewijzing);
        }

        return {
            ...indeling,
            afwijzingen,
            toewijzingQueue: indeling.toewijzingQueue.filter(ondernemer =>
                ondernemer.erkenningsNummer !== erkenningsNummer
            )
        };
    }
};

export default Indeling;

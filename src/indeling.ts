import {
    DeelnemerStatus,
    IAfwijzingReason,
    IBranche,
    IMarkt,
    IMarktindeling,
    IMarktindelingSeed,
    IMarktondernemer,
    IMarktplaats,
    IObstakelBetween,
    IPlaatsvoorkeur,
    IRSVP,
    IToewijzing,
    PlaatsId,
} from './markt.model';

/*
 * https://decentrale.regelgeving.overheid.nl/cvdr/XHTMLoutput/Actueel/Amsterdam/396119.html#id1-3-2-2-3-4-5
 */
const VOORKEUR_MINIMUM_PRIORITY = 0;

const intersects = (a: any[] = [], b: any[] = []) =>
    a.some(value => b.includes(value)) || b.some(value => a.includes(value));

const intersection = (a: any[] = [], b: any[] = []) => a.filter(value => b.includes(value));

const exclude = <T>(a: T[] = [], b: any[] = []): T[] => a.filter(value => !b.includes(value));

const isVast = (status: DeelnemerStatus): boolean => status === 'vpl' || status === 'vkk';

/*
 * Example usage: [42, 37].sort(numberSort)
 */
const numberSort = (a: number, b: number): number => (a > b ? 1 : a === b ? 0 : -1);

/*
 * Example usage: [[1], [2]].reduce(flatten, [])
 */
const flatten = <T>(a: T[] = [], b: T[] = []): T[] => [...a, ...b];

/*
 * Example usage: [1, 2].reduce(sum, 0)
 */
const sum = (a: number, b: number): number => a + b;

/*
 * Example usage: [1, 2, 1, 2, 3].reduce(unique, [])
 */
const unique = <T>(a: T[], b: T): T[] => (a.includes(b) ? a : [...a, b]);

const isEqualArray = (a: any[], b: any[]): boolean =>
    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]);

const log = (...arg: any) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log.apply(console, arg);
    }
};

const count = <T>(arrayMaybe: T | T[]): number =>
    arrayMaybe ? (Array.isArray(arrayMaybe) ? arrayMaybe.length : 1) : 0;

const prioritySort = (voorkeurA?: IPlaatsvoorkeur, voorkeurB?: IPlaatsvoorkeur) => {
    const prioA = voorkeurA && typeof voorkeurA.priority === 'number' ? voorkeurA.priority : VOORKEUR_MINIMUM_PRIORITY;
    const prioB = voorkeurB && typeof voorkeurB.priority === 'number' ? voorkeurB.priority : VOORKEUR_MINIMUM_PRIORITY;

    return numberSort(-prioA, -prioB);
};

const PRIORITIES = ['vpl', 'vkk', 'soll'];
const LOWEST_STATUS_PRIORITY = PRIORITIES.length;
const statusPriority = (status: DeelnemerStatus): number => {
    const index = PRIORITIES.indexOf(status);

    return index === -1 ? LOWEST_STATUS_PRIORITY : index;
};

const sortPlaatsen = (plaatsen: IMarktplaats[], voorkeuren: IPlaatsvoorkeur[]) =>
    [...plaatsen].sort((a, b) => {
        const voorkeurA = voorkeuren.find(voorkeur => voorkeur.plaatsId === a.plaatsId);
        const voorkeurB = voorkeuren.find(voorkeur => voorkeur.plaatsId === b.plaatsId);

        return prioritySort(voorkeurA, voorkeurB);
    });

const FULL_REASON: IAfwijzingReason = {
    code: 1,
    message: 'Alle marktplaatsen zijn reeds ingedeeld',
};

const BRANCHE_FULL_REASON: IAfwijzingReason = {
    code: 2,
    message: 'Alle marktplaatsen voor deze branch zijn reeds ingedeeld',
};

const createToewijzing = (markt: IMarkt, plaats: IMarktplaats, ondernemer: IMarktondernemer): IToewijzing => ({
    marktId: markt.marktId,
    marktDate: markt.marktDate,
    plaatsen: [plaats.plaatsId],
    ondernemer,
    erkenningsNummer: ondernemer.erkenningsNummer,
});

const matchesObstakel = (plaatsA: string, plaatsB: string, obstakel: IObstakelBetween): boolean =>
    (obstakel.kraamA === plaatsA && obstakel.kraamB === plaatsB) ||
    (obstakel.kraamA === plaatsB && obstakel.kraamB === plaatsA);

const logOpenPlaatsen = (indeling: IMarktindeling) => log(`Nog ${indeling.openPlaatsen.length} vrije plaatsen`);

export const getAdjacentPlaatsen = (
    rows: IMarktplaats[][],
    plaatsId: PlaatsId,
    obstakels: IObstakelBetween[] = [],
): IMarktplaats[] =>
    rows
        .map(row => {
            const targetIndex = row.findIndex(plaats => plaats.plaatsId === plaatsId);

            return targetIndex !== -1
                ? row.filter((_, index) => index === targetIndex - 1 || index === targetIndex + 1)
                : [];
        })
        .reduce(flatten, [])
        .filter(plaatsB => !obstakels.some(obstakel => matchesObstakel(plaatsId, plaatsB.plaatsId, obstakel)));

/*
 * Returns adjacent places in either direction,
 * `steps` defines the limit of how far to look in either direction.
 * The number of adjacent spots can be greater than  the number of steps, if a number
 * of spots is available in either direction.
 */
export const getAdjacentPlaatsenRecursive = (
    rows: IMarktplaats[][],
    plaatsId: string,
    steps: number = 1,
    obstakels: IObstakelBetween[] = [],
): string[] => {
    let plaatsen: string[] = [plaatsId],
        prevPlaatsen: string[] = [],
        i = 0;

    while (i < steps && !isEqualArray(plaatsen, prevPlaatsen)) {
        const newPlaatsen: string[] = exclude(plaatsen, prevPlaatsen);
        prevPlaatsen = plaatsen;

        const adjacentPlaatsen = newPlaatsen
            .map(p => getAdjacentPlaatsen(rows, p, obstakels))
            .reduce(flatten, [])
            .map(({ plaatsId }) => plaatsId);

        plaatsen = [...plaatsen, ...adjacentPlaatsen];

        i++;
    }

    plaatsen = exclude(plaatsen, [plaatsId]);

    return plaatsen;
};

const getAdjacentPlaatsenForMultiple = (
    rows: IMarktplaats[][],
    plaatsIds: PlaatsId[],
    obstakels: IObstakelBetween[] = [],
): IMarktplaats[] =>
    plaatsIds
        .map(plaatsId => getAdjacentPlaatsen(rows, plaatsId, obstakels))
        .reduce(flatten, [])
        .reduce(unique, []);

const getOndernemerBranches = (markt: IMarkt, ondernemer: IMarktondernemer) =>
    ((ondernemer.voorkeur && ondernemer.voorkeur.branches) || []).map(
        brancheId =>
            markt.branches.find(b => b.brancheId === brancheId) || {
                brancheId,
            },
    );

const getOndernemerVoorkeuren = (markt: IMarkt, ondernemer: IMarktondernemer): IPlaatsvoorkeur[] =>
    markt.voorkeuren.filter(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer) || [];

const onlyVoorkeursPlaatsen = (plaatsen: IMarktplaats[], voorkeuren: IPlaatsvoorkeur[]): IMarktplaats[] => {
    const voorkeursplaatsen = voorkeuren.map(({ plaatsId }) => plaatsId);

    return plaatsen.filter(({ plaatsId }) => voorkeursplaatsen.includes(plaatsId));
};

const getTargetSize = (ondernemer: IMarktondernemer): number =>
    ondernemer.voorkeur ? Math.max(1, ondernemer.voorkeur.minimum || null, ondernemer.voorkeur.maximum || null) : 1;

const findOptimalSpot = (
    ondernemer: IMarktondernemer,
    voorkeuren: IPlaatsvoorkeur[],
    openPlaatsen: IMarktplaats[],
    markt: IMarkt,
    maximum: number = 1,
) => {
    let mogelijkePlaatsen = openPlaatsen;

    // log(`Vind een plaats voor ${ondernemer.id}`);

    const ondernemerBranches = getOndernemerBranches(markt, ondernemer);

    mogelijkePlaatsen = ondernemerBranches.reduce(
        (mogelijkePlaatsen: IMarktplaats[], branche: IBranche): IMarktplaats[] => {
            if (branche.verplicht) {
                /*
                 * Bijvoorbeeld: als de ondernemer een wil frituren (`{ "branche": "bak" }`)
                 * dan blijven alleen nog de kramen over waarop frituren is toegestaan.
                 */
                mogelijkePlaatsen = mogelijkePlaatsen.filter(
                    plaats => plaats.branches && plaats.branches.find(brancheId => brancheId === branche.brancheId),
                );
                log(
                    `Filter op branche: ${branche.brancheId} (${mogelijkePlaatsen.length}/${openPlaatsen.length} over)`,
                );
            } else {
                log(`Sorteer op branche: ${branche.brancheId}`);
                /*
                 * Een groenteboer wordt bij voorkeur geplaatst op een plaats in de branch AGF.
                 */
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
        mogelijkePlaatsen,
    );

    if (ondernemer.voorkeur && typeof ondernemer.voorkeur.anywhere === 'boolean' && !ondernemer.voorkeur.anywhere) {
        mogelijkePlaatsen = onlyVoorkeursPlaatsen(mogelijkePlaatsen, voorkeuren);
    }

    // voorkeuren.sort((a, b) => numberSort(a.priority, b.priority));

    mogelijkePlaatsen = sortPlaatsen(mogelijkePlaatsen, voorkeuren);

    if (maximum > 1) {
        console.log(`Ondernemer ${ondernemer.erkenningsNummer} wil in één keer ${maximum} plaatsen`);
        const prevMogelijkePlaatsen = mogelijkePlaatsen;
        mogelijkePlaatsen = mogelijkePlaatsen.filter(p => {
            const expansionSize = maximum - 1;
            const adjacent = getAdjacentPlaatsenRecursive(markt.rows, p.plaatsId, expansionSize, markt.obstakels);

            return adjacent.length >= expansionSize;
        });

        console.log(
            'Van deze plaatsen: ',
            prevMogelijkePlaatsen.map(({ plaatsId }) => plaatsId),
            ` hebben de volgende mogelijkheid tot uitbreiden naar ${maximum} plaatsen: `,
            mogelijkePlaatsen.map(({ plaatsId }) => plaatsId),
        );
    }

    return mogelijkePlaatsen[0];
};

export const isAanwezig = (aanwezigheid: IRSVP[], ondernemer: IMarktondernemer) => {
    const rsvp = aanwezigheid.find(aanmelding => aanmelding.erkenningsNummer === ondernemer.erkenningsNummer);

    /*
     * Vasteplaatshouders die niets hebben laten weten en die hebben bevestigd dat ze
     * komen worden meegeteld als aanwezig. Alleen de expliciete afmeldingen worden
     * niet in overweging genomen in de toedeling van kramen.
     */
    if (ondernemer.status === 'vpl') {
        return !rsvp || !!rsvp.attending || rsvp.attending === null;
    } else {
        return !!rsvp && !!rsvp.attending;
    }
};

const removeToewijzing = (state: IMarktindeling, toewijzing: IToewijzing) => {
    const { openPlaatsen, toewijzingen } = state;

    if (toewijzingen.includes(toewijzing)) {
        log(`Verwijder toewijzing van ${toewijzing.erkenningsNummer} aan ${toewijzing.plaatsen}`);

        const plaatsen = state.marktplaatsen.filter(plaats => toewijzing.plaatsen.includes(plaats.plaatsId));

        return {
            ...state,
            toewijzingen: toewijzingen.filter(t => t !== toewijzing),
            openPlaatsen: [...openPlaatsen, ...plaatsen],
        };
    } else {
        return state;
    }
};

const findToewijzing = (state: IMarktindeling, ondernemer: IMarktondernemer) =>
    state.toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === ondernemer.erkenningsNummer);

const addToewijzing = (state: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => ({
    ...state,
    toewijzingQueue: state.toewijzingQueue.filter(
        ondernemer => ondernemer.erkenningsNummer !== toewijzing.erkenningsNummer,
    ),
    openPlaatsen: state.openPlaatsen.filter(plaats => !toewijzing.plaatsen.includes(plaats.plaatsId)),
    toewijzingen: [...state.toewijzingen, toewijzing],
});

const replaceToewijzing = (indeling: IMarktindeling, remove: IToewijzing, add: IToewijzing): IMarktindeling => ({
    ...indeling,
    toewijzingen: [...indeling.toewijzingen.filter(item => item !== remove), add],
});

const mergeToewijzing = (a: IToewijzing, b: IToewijzing): IToewijzing => ({
    ...a,
    ...b,
    plaatsen: [...(a.plaatsen || []), ...(b.plaatsen || [])],
});

const assignPlaats = (
    markt: IMarktindeling,
    toewijzing: IToewijzing,
    ondernemer: IMarktondernemer,
    conflictResolution: 'merge' | 'reassign' | 'keep-both' = 'keep-both',
) => {
    log(`Plaats toegewezen aan ${ondernemer.erkenningsNummer}: ${toewijzing.plaatsen}`);
    const existingToewijzing = findToewijzing(markt, ondernemer);

    let newToewijzing: IToewijzing = {
        marktId: markt.marktId,
        marktDate: markt.marktDate,
        plaatsen: [...toewijzing.plaatsen],
        erkenningsNummer: ondernemer.erkenningsNummer,

        // For convenience, access to the full object
        ondernemer,
    };

    if (existingToewijzing) {
        log(`Ondernemer is reeds toegwezen aan plaats(en): ${existingToewijzing.plaatsen.join(', ')}`);

        if (conflictResolution === 'merge') {
            newToewijzing = mergeToewijzing(existingToewijzing, newToewijzing);
        }

        if (conflictResolution !== 'keep-both') {
            markt = removeToewijzing(markt, existingToewijzing);
        }
    }

    return addToewijzing(markt, newToewijzing);
};

const rejectOndernemer = (state: IMarktindeling, ondernemer: IMarktondernemer, reason: IAfwijzingReason) => {
    log(`Aanmelding afgewezen voor ${ondernemer.erkenningsNummer}: ${reason.message} ${state.afwijzingen.length}`);

    return {
        ...state,
        afwijzingen: [
            ...state.afwijzingen,
            {
                marktId: state.marktId,
                marktDate: state.marktDate,
                erkenningsNummer: ondernemer.erkenningsNummer,
                reason,
                ondernemer,
            },
        ],
    };
};

const assignVastePlaats = (state: IMarktindeling, ondernemer: IMarktondernemer): IMarktindeling => {
    const { openPlaatsen } = state;

    let vastePlaatsen = ondernemer.plaatsen
        .map(vastePlaatsId => openPlaatsen.find(({ plaatsId }) => plaatsId === vastePlaatsId))
        .filter(Boolean);

    vastePlaatsen = sortPlaatsen(vastePlaatsen, getOndernemerVoorkeuren(state, ondernemer));

    /*
     * TODO: Handle the cases filtered out by `filter(Boolean)`,
     * at least log a notification someone could't be assigned to their designated spot.
     */

    if (vastePlaatsen.length < ondernemer.plaatsen.length && vastePlaatsen.length === 0) {
        /*
         * Not a single spot was available, consider the `ondernemer` fully rejected
         * FIXME: ondernemer doesn't have to be rejected when it can move to another open spot
         */
        state = rejectOndernemer(state, ondernemer, { message: 'Vaste plaats(en) niet beschikbaar' });
    }

    state = vastePlaatsen
        .slice(
            0,
            ondernemer.voorkeur && ondernemer.voorkeur.maximum
                ? Math.min(vastePlaatsen.length, ondernemer.voorkeur.maximum || null)
                : vastePlaatsen.length,
        )
        .map(plaats => {
            log(`Wijs ondernemer ${ondernemer.erkenningsNummer} toe aan vaste plaats ${plaats.plaatsId}`);

            return plaats;
        })
        .reduce((state, plaats) => {
            const openPlaats = openPlaatsen.find(openPlaats => openPlaats.plaatsId === plaats.plaatsId);

            if (openPlaats) {
                return assignPlaats(state, createToewijzing(state, plaats, ondernemer), ondernemer, 'merge');
            } else {
                return rejectOndernemer(state, ondernemer, {
                    message: `Een van de vaste plaatsen is niet beschikbaar: ${plaats.plaatsId}`,
                });
            }
        }, state);

    return state;
};

const assignUitbreiding = (indeling: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => {
    const { ondernemer, plaatsen } = toewijzing;
    const { erkenningsNummer } = ondernemer;
    const targetSize = getTargetSize(ondernemer);
    const currentSize = plaatsen.length;

    const removeFromQueue = (indeling: IMarktindeling, toewijzing: IToewijzing) => ({
        ...indeling,
        expansionQueue: (indeling.expansionQueue || []).filter(t => t !== toewijzing),
    });

    const replaceInQueue = (indeling: IMarktindeling, current: IToewijzing, replacement: IToewijzing) => ({
        ...indeling,
        expansionQueue: indeling.expansionQueue.map(item => (item === current ? replacement : item)),
    });

    if (currentSize < targetSize) {
        const adjacent = getAdjacentPlaatsenForMultiple(indeling.rows, plaatsen, indeling.obstakels);
        const openAdjacent = intersection(adjacent, indeling.openPlaatsen);

        log(
            `Er zijn ${openAdjacent.length} open van de ${adjacent.length} aanliggende plaatsen voor ${plaatsen.join(
                ', ',
            )}: ${openAdjacent.map(({ plaatsId }) => plaatsId).join(', ')}`,
        );

        const uitbreidingPlaats = findOptimalSpot(
            ondernemer,
            getOndernemerVoorkeuren(indeling, ondernemer),
            openAdjacent,
            indeling,
        );

        if (uitbreidingPlaats) {
            // Remove vrije plaats
            indeling = {
                ...indeling,
                openPlaatsen: indeling.openPlaatsen.filter(plaats => plaats.plaatsId !== uitbreidingPlaats.plaatsId),
            };

            const uitbreiding = {
                ...toewijzing,
                plaatsen: [...toewijzing.plaatsen, uitbreidingPlaats.plaatsId],
            };

            log(
                `Ondernemer ${ondernemer.erkenningsNummer} kan uitbreiden naar ${uitbreidingPlaats.plaatsId}`,
                toewijzing,
                uitbreiding,
            );

            indeling = replaceToewijzing(indeling, toewijzing, uitbreiding);

            if (currentSize + 1 < targetSize) {
                // Do You Want More?!!!??!
                indeling = replaceInQueue(indeling, toewijzing, uitbreiding);
            } else {
                indeling = removeFromQueue(indeling, toewijzing);
            }
            // TODO: Merge `toewijzing` and `uitbreiding` objects, add to `indeling`
        } else {
            log(
                `Geen uitbreiding van ${currentSize} naar ${currentSize +
                    1} plaatsen voor ondernemer ${erkenningsNummer}`,
            );
            indeling = removeFromQueue(indeling, toewijzing);
        }
    }

    return indeling;
};

const heeftVastePlaatsen = (ondernemer: IMarktondernemer): boolean =>
    isVast(ondernemer.status) && count(ondernemer.plaatsen) > 0;

const getBrancheStats = (state: IMarktindeling, brancheId: string) => {
    const branche = (state.branches || []).find(item => item.brancheId === brancheId);

    const maximumPlaatsen =
        !!branche && typeof branche.maximumPlaatsen === 'number' ? branche.maximumPlaatsen : Infinity;

    const maximumToewijzingen =
        !!branche && typeof branche.maximumToewijzingen === 'number' ? branche.maximumToewijzingen : Infinity;

    const currentToewijzingen = state.toewijzingen.filter(toewijzing =>
        ((toewijzing.ondernemer.voorkeur && toewijzing.ondernemer.voorkeur.branches) || []).includes(brancheId),
    );

    const currentPlaatsen = currentToewijzingen.map(toewijzing => toewijzing.plaatsen.length).reduce(sum, 0);

    return {
        branche,
        plaatsen: {
            current: currentPlaatsen,
            maximum: maximumPlaatsen,
        },
        toewijzingen: {
            current: currentToewijzingen.length,
            maximum: maximumToewijzingen,
        },
    };
};

const calcDefaultVoorkeuren = (markt: IMarkt, ondernemers: IMarktondernemer[]): IPlaatsvoorkeur[] =>
    ondernemers
        .map(({ plaatsen, erkenningsNummer }) =>
            (plaatsen || []).map(
                (plaatsId: string): IPlaatsvoorkeur => ({
                    erkenningsNummer,
                    marktId: markt.marktId,
                    plaatsId,
                    priority: VOORKEUR_MINIMUM_PRIORITY,
                }),
            ),
        )
        .reduce(flatten, []);

const getMaxedOutBranches = (state: IMarktindeling, branches: string[]) =>
    branches.filter(brancheId => {
        const { branche, toewijzingen, plaatsen } = getBrancheStats(state, brancheId);

        if (toewijzingen.maximum < Infinity) {
            log(
                `${toewijzingen.current}/${toewijzingen.maximum} ondernemers in branche ${
                    branche.brancheId
                } toegewezen`,
            );
        }

        if (plaatsen.maximum < Infinity) {
            log(`${plaatsen.current}/${plaatsen.maximum} marktplaatsen in branche ${branche.brancheId} toegewezen`);
        }

        return toewijzingen.current >= toewijzingen.maximum || plaatsen.current >= plaatsen.maximum;
    });

const findPlaats = (
    state: IMarktindeling,
    ondernemer: IMarktondernemer,
    index: number,
    ondernemers: IMarktondernemer[],
    plaatsen?: IMarktplaats[],
    handleRejection: 'reject' | 'ignore' = 'reject',
    maximum: number = 1,
): IMarktindeling => {
    const mogelijkePlaatsen = plaatsen || state.openPlaatsen;

    const branches = getOndernemerBranches(state, ondernemer);
    log(`Branches van ${ondernemer.erkenningsNummer}: `, branches, ondernemer.voorkeur && ondernemer.voorkeur.branches);
    // const requiredBranches = branches.filter(branche => branche.verplicht).map(branche => branche.brancheId);

    // if (requiredBranches) {
    // mogelijkePlaatsen = mogelijkePlaatsen.filter(plaats => intersects(plaats.branches, branches));
    // }

    const ondernemerVoorkeuren = getOndernemerVoorkeuren(state, ondernemer);

    let reason;

    if (state.openPlaatsen.length === 0) {
        reason = FULL_REASON;
    }

    const brancheLimitsExceeded = getMaxedOutBranches(
        state,
        (ondernemer.voorkeur && ondernemer.voorkeur.branches) || [],
    );

    if (brancheLimitsExceeded.length > 0) {
        reason = BRANCHE_FULL_REASON;
    }

    logOpenPlaatsen(state);

    log(`Ondernemer ${ondernemer.erkenningsNummer} heeft ${ondernemerVoorkeuren.length} voorkeuren genoemd`);

    let plaats;

    if (!reason) {
        plaats = findOptimalSpot(ondernemer, ondernemerVoorkeuren, mogelijkePlaatsen, state, maximum);
    }

    if (plaats) {
        return assignPlaats(state, createToewijzing(state, plaats, ondernemer), ondernemer, 'reassign');
    } else {
        log(`Geen plaats gevonden voor ${ondernemer.erkenningsNummer}`);
        if (handleRejection === 'reject') {
            return rejectOndernemer(state, ondernemer, reason || { message: 'Geen plaats gevonden' });
        } else {
            return state;
        }
    }
};

type MoveQueueItem = {
    toewijzing: IToewijzing;
    betereVoorkeuren: IPlaatsvoorkeur[];
    openPlaatsen: IMarktplaats[];
    beterePlaatsen: IMarktplaats[];
};

const move = (state: IMarktindeling, obj: MoveQueueItem) =>
    findPlaats(
        state,
        obj.toewijzing.ondernemer,
        0,
        [],
        intersection(obj.beterePlaatsen, state.openPlaatsen),
        'ignore',
        obj.toewijzing.plaatsen.length,
    );

const getPossibleMoves = (state: IMarktindeling, toewijzing: IToewijzing): MoveQueueItem => {
    const { ondernemer } = toewijzing;
    const voorkeuren = getOndernemerVoorkeuren(state, ondernemer).sort(prioritySort);

    const currentIndex = voorkeuren.findIndex(voorkeur => toewijzing.plaatsen.includes(voorkeur.plaatsId));
    const betereVoorkeuren = voorkeuren.slice(0, currentIndex === -1 ? voorkeuren.length : currentIndex);

    const beterePlaatsen = betereVoorkeuren
        .map(voorkeur => state.marktplaatsen.find(({ plaatsId }) => plaatsId === voorkeur.plaatsId))
        .filter(Boolean);

    const openPlaatsen = betereVoorkeuren
        .map(voorkeur => state.openPlaatsen.find(({ plaatsId }) => plaatsId === voorkeur.plaatsId))
        .filter(Boolean);

    return {
        toewijzing,
        betereVoorkeuren,
        beterePlaatsen,
        openPlaatsen,
    };
};

export const calcVolgorde = (ondernemers: IMarktondernemer[], aLijst: IMarktondernemer[] = []): IMarktondernemer[] => {
    const abLijstPriority = (ondernemer: IMarktondernemer): number => (aLijst.includes(ondernemer) ? 1 : 2);

    const ondernemerSort = (a: IMarktondernemer, b: IMarktondernemer) => {
        // A-lijst of B-lijst
        const sort1 = numberSort(abLijstPriority(a), abLijstPriority(b));

        // Vastekaarthouders, tijdelijkevasteplaatshouders, sollicitanten
        const sort2 = numberSort(statusPriority(a.status), statusPriority(b.status));

        // Ancienniteitsnummer
        const sort3 = numberSort(a.sollicitatieNummer, b.sollicitatieNummer);

        return sort1 || sort2 || sort3;
    };

    return [...ondernemers].sort(ondernemerSort);
};

export const calcAanwezigenVolgorde = (
    ondernemers: IMarktondernemer[],
    aanwezigheid: IRSVP[] = [],
    aLijst: IMarktondernemer[],
): IMarktondernemer[] => {
    const aanwezigen = ondernemers.filter(ondernemer => isAanwezig(aanwezigheid, ondernemer));

    return calcVolgorde(aanwezigen, aLijst);
};

export const calcToewijzingen = (markt: IMarkt & IMarktindelingSeed): IMarktindeling => {
    const { marktplaatsen, ondernemers, voorkeuren } = markt;
    const { aanwezigheid, aLijst } = markt;

    const abLijstPriority = (ondernemer: IMarktondernemer): number => (aLijst.includes(ondernemer) ? 1 : 2);

    const ondernemerSort = (a: IMarktondernemer, b: IMarktondernemer) => {
        // A-lijst of B-lijst
        const sort1 = numberSort(abLijstPriority(a), abLijstPriority(b));

        // Vastekaarthouders, tijdelijkevasteplaatshouders, sollicitanten
        const sort2 = numberSort(statusPriority(a.status), statusPriority(b.status));

        // Ancienniteitsnummer
        const sort3 = numberSort(a.sollicitatieNummer, b.sollicitatieNummer);

        return sort1 || sort2 || sort3;
    };

    const aanwezigen = calcAanwezigenVolgorde(ondernemers, aanwezigheid, aLijst);

    log(
        `Aanwezigen: ${aanwezigen.length}/${ondernemers.length} (${(
            (aanwezigen.length / ondernemers.length) *
            100
        ).toFixed(1)}%)`,
    );

    /*
     * De bij een herindeling gekozen marktplaats wordt verwerkt als de initiele voorkeur van de ondernemer.
     * Bij de dagindeling kan een andere voorkeur worden uitgesproken.
     */
    const defaultVoorkeuren = calcDefaultVoorkeuren(markt, aanwezigen.filter(({ status }) => isVast(status)));

    const initialState: IMarktindeling = {
        ...markt,
        toewijzingQueue: [...aanwezigen],
        expansionQueue: [],
        expansionIteration: 1,
        expansionLimit: Math.min(
            Number.isFinite(markt.expansionLimit) ? markt.expansionLimit : Infinity,
            markt.marktplaatsen.length,
        ),
        afwijzingen: [],
        toewijzingen: [],
        openPlaatsen: [...marktplaatsen.filter(plaats => !plaats.inactive)],
        voorkeuren: [...defaultVoorkeuren, ...voorkeuren],
    };

    const vastePlaatsenQueue = initialState.toewijzingQueue.filter(heeftVastePlaatsen);

    log(`Vasteplaatshouders eerst: ${vastePlaatsenQueue.length}`);

    /*
     * stap 1:
     * vasteplaatshouders
     */

    let indeling = vastePlaatsenQueue.reduce(assignVastePlaats, initialState);

    /*
     * stap 2:
     * beperkt de indeling tot kramen met een bepaalde verkoopinrichting
     */
    const brancheKramen = initialState.openPlaatsen.filter(plaats => count(plaats.branches) > 0);
    const brancheOndernemers = indeling.toewijzingQueue.filter(
        ondernemer => count(ondernemer.voorkeur && ondernemer.voorkeur.branches) > 0,
    );

    log(`Branche-kramen: ${brancheKramen.length}`);
    log(`Branche-ondernemers: ${brancheOndernemers.length}`);

    indeling = brancheOndernemers.reduce((indeling, ondernemer, index, ondernemers) => {
        const ondernemerBranchePlaatsen = indeling.openPlaatsen.filter(plaats =>
            intersects(plaats.branches, ondernemer.voorkeur && ondernemer.voorkeur.branches),
        );
        log(
            `Branche-ondernemer ${ondernemer.erkenningsNummer} kan kiezen uit ${
                ondernemerBranchePlaatsen.length
            } plaatsen`,
        );

        return findPlaats(indeling, ondernemer, index, ondernemers, ondernemerBranchePlaatsen, 'ignore');
    }, indeling);

    /*
     * stap 3:
     * beperkt de indeling tot kramen met een toewijzingsbeperking (branche, eigen materieel)
     * en ondernemers met een bijbehorende eigenschap
     */
    const verkoopinrichtingKramen = initialState.openPlaatsen.filter(plaats => count(plaats.verkoopinrichting) > 0);
    const verkoopinrichtingOndernemers = indeling.toewijzingQueue.filter(
        ondernemer => count(ondernemer.voorkeur && ondernemer.voorkeur.verkoopinrichting) > 0,
    );

    log(`Verkoopinrichting-kramen: ${verkoopinrichtingKramen.length}`);
    log(`Verkoopinrichting-ondernemers: ${verkoopinrichtingOndernemers.length}`);

    indeling = verkoopinrichtingOndernemers.reduce((indeling, ondernemer, index, ondernemers) => {
        const ondernemerVerkoopinrichtingPlaatsen = indeling.openPlaatsen.filter(plaats =>
            intersects(plaats.verkoopinrichting, ondernemer.voorkeur ? ondernemer.voorkeur.verkoopinrichting : []),
        );
        log(
            `Bijzondere verkoopinrichting-ondernemer ${ondernemer.erkenningsNummer} kan kiezen uit ${
                ondernemerVerkoopinrichtingPlaatsen.length
            } plaatsen`,
        );

        return findPlaats(indeling, ondernemer, index, ondernemers, ondernemerVerkoopinrichtingPlaatsen, 'ignore');
    }, indeling);

    // Deel sollicitanten in
    indeling = indeling.toewijzingQueue
        .filter(ondernemer => !heeftVastePlaatsen(ondernemer))
        .reduce(findPlaats, indeling);

    const calculateMoveQueue = (state: IMarktindeling): MoveQueueItem[] =>
        state.toewijzingen
            .map(toewijzing => getPossibleMoves(state, toewijzing))
            .filter(obj => obj.betereVoorkeuren.length > 0)
            .sort((objA, objB) => ondernemerSort(objA.toewijzing.ondernemer, objB.toewijzing.ondernemer))
            .map(obj => {
                const {
                    toewijzing: { ondernemer },
                    betereVoorkeuren,
                    openPlaatsen,
                } = obj;

                log(
                    `Voor ondernemer ${ondernemer.erkenningsNummer} zijn er nog ${
                        betereVoorkeuren.length
                    } plaatsen die meer gewenst zijn (van de in totaal ${
                        voorkeuren.length
                    } voorkeuren: ${voorkeuren.map(({ plaatsId }) => plaatsId).join(', ')}), en daarvan zijn nog ${
                        openPlaatsen.length
                    } vrij: ${openPlaatsen.map(({ plaatsId }) => plaatsId).join(', ')}`,
                );

                return obj;
            });

    const moveQueue = calculateMoveQueue(indeling);

    const processMoveQueue = (state: IMarktindeling, queue: MoveQueueItem[]): IMarktindeling => {
        let i = 0;
        const MOVE_LIMIT = 100;

        for (; queue.length > 0 && i < MOVE_LIMIT; i++) {
            log(`Move-queue #${i}: ${queue.length}`);

            const previousState = state;

            state = queue.reduce(move, state);

            if (previousState === state) {
                // Non-essential optimization: nothing changed, so this was the last iteration.
                // This could happen when someone wants to move to an open spot, but something is preventing the move.
                // In this case don't retry the same move until the `MOVE_LIMIT` is exhausted.
                break;
            }
            // TODO: the new `queue` should be created as copy or subset of the existing `queue`,
            // and when all options to move to a better spot have failed and the options are exhausted,
            // the person should not be included in the new queue.
            queue = calculateMoveQueue(state);
        }

        return state;
    };

    indeling = processMoveQueue(
        indeling,
        moveQueue.filter(({ toewijzing: { ondernemer } }) => ondernemer.status === 'vpl'),
    );

    indeling = processMoveQueue(
        indeling,
        moveQueue.filter(({ toewijzing: { ondernemer } }) => ondernemer.status === 'vkk'),
    );

    indeling = processMoveQueue(indeling, moveQueue);

    indeling = {
        ...indeling,
        expansionQueue: indeling.toewijzingen.filter(
            ({ ondernemer }) => !!ondernemer.voorkeur && getTargetSize(ondernemer) > indeling.expansionIteration,
        ),
    };

    while (indeling.expansionIteration <= indeling.expansionLimit) {
        log(
            `Uitbreidingsronde naar ${indeling.expansionIteration} plaatsen (later tot maximaal ${
                indeling.expansionLimit
            }) voor ${indeling.expansionQueue.length} deelnemers`,
        );

        // TODO: Remove items from expansion queue for which expansion was impossible,
        // skip those in the next iteration.

        indeling = indeling.expansionQueue
            .filter(toewijzing => {
                const { ondernemer, plaatsen } = toewijzing;
                const currentSize = plaatsen.length;
                const targetSize = getTargetSize(ondernemer);

                return currentSize < Math.min(targetSize, indeling.expansionIteration, indeling.expansionLimit);
            })
            .map(toewijzing => {
                const { ondernemer, plaatsen } = toewijzing;
                const currentSize = plaatsen.length;
                const targetSize = getTargetSize(ondernemer);

                log(
                    `Ondernemer ${
                        ondernemer.erkenningsNummer
                    } wil ${targetSize} plaatsen, en heeft nu ${currentSize} plaats(en)`,
                    toewijzing,
                );

                return toewijzing;
            })
            .filter(toewijzing => {
                const branches = getMaxedOutBranches(
                    indeling,
                    (toewijzing.ondernemer.voorkeur && toewijzing.ondernemer.voorkeur.branches) || [],
                );

                if (branches.length > 0) {
                    log(
                        `Ondernemer ${
                            toewijzing.ondernemer.erkenningsNummer
                        } kan niet uitbreiden, branche-limiet bereikt: ${branches.join(', ')}`,
                    );
                }

                return branches.length === 0;
            })
            .reduce(assignUitbreiding, indeling);

        /*
        console.warn(
            `Na mogelijkheid tot uitbreiding ${indeling.expansionIteration} zijn er nog ${
                indeling.expansionQueue.map(({ ondernemer }) => ondernemer).reduce(unique, []).length
            } ondernemers die meer plaatsen willen`,
        );
        */

        indeling = {
            ...indeling,
            expansionIteration: indeling.expansionIteration + 1,
        };
    }

    log(indeling.toewijzingen.map(data => ({ ...data, ondernemer: undefined })));

    return indeling;
};

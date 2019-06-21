import {
    DeelnemerStatus,
    IAfwijzingReason,
    IBranche,
    IMarkt,
    IMarktindeling,
    IMarktindelingSeed,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IRSVP,
    IToewijzing,
    PlaatsId,
} from './markt.model';

const VOORKEUR_MINIMUM_PRIORITY = 0;

const intersects = (a: any[] = [], b: any[] = []) =>
    a.some(value => b.includes(value)) || b.some(value => a.includes(value));

const intersection = (a: any[] = [], b: any[] = []) => a.filter(value => b.includes(value));

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

const createToewijzing = (plaats: IMarktplaats, ondernemer: IMarktondernemer): IToewijzing => ({
    plaatsen: [plaats.plaatsId],
    ondernemer,
    erkenningsNummer: ondernemer.erkenningsNummer,
});

const logOpenPlaatsen = (indeling: IMarktindeling) => log(`Nog ${indeling.openPlaatsen.length} vrije plaatsen`);

const getAdjacentPlaatsen = (markt: IMarktindeling, plaatsId: PlaatsId): IMarktplaats[] =>
    markt.rows
        .map(row => {
            const targetIndex = row.findIndex(plaats => plaats.plaatsId === plaatsId);

            return targetIndex !== -1
                ? row.filter((_, index) => index === targetIndex - 1 || index === targetIndex + 1)
                : [];
        })
        .reduce(flatten);

const getAdjacentPlaatsenForMultiple = (markt: IMarktindeling, plaatsIds: PlaatsId[]): IMarktplaats[] =>
    plaatsIds
        .map(plaatsId => getAdjacentPlaatsen(markt, plaatsId))
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

const findOptimalSpot = (
    ondernemer: IMarktondernemer,
    voorkeuren: IPlaatsvoorkeur[],
    openPlaatsen: IMarktplaats[],
    markt: IMarkt,
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

    const onlyVoorkeursPlaatsen = (plaatsen: IMarktplaats[], voorkeuren: IPlaatsvoorkeur[]): IMarktplaats[] => {
        const voorkeursplaatsen = voorkeuren.map(({ plaatsId }) => plaatsId);

        return mogelijkePlaatsen.filter(({ plaatsId }) => voorkeursplaatsen.includes(plaatsId));
    };

    if (ondernemer.voorkeur && typeof ondernemer.voorkeur.anywhere === 'boolean' && !ondernemer.voorkeur.anywhere) {
        mogelijkePlaatsen = onlyVoorkeursPlaatsen(mogelijkePlaatsen, voorkeuren);
    }

    // voorkeuren.sort((a, b) => numberSort(a.priority, b.priority));

    mogelijkePlaatsen = sortPlaatsen(mogelijkePlaatsen, voorkeuren);

    return mogelijkePlaatsen[0];
};

const isAanwezig = (aanwezigheid: IRSVP[], ondernemer: IMarktondernemer) => {
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
    state: IMarktindeling,
    toewijzing: IToewijzing,
    ondernemer: IMarktondernemer,
    conflictResolution: 'merge' | 'reassign' | 'keep-both' = 'keep-both',
) => {
    log(`Plaats toegewezen aan ${ondernemer.erkenningsNummer}: ${toewijzing.plaatsen}`);
    const existingToewijzing = findToewijzing(state, ondernemer);

    let newToewijzing = {
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
            state = removeToewijzing(state, existingToewijzing);
        }
    }

    return addToewijzing(state, newToewijzing);
};

const rejectOndernemer = (state: IMarktindeling, ondernemer: IMarktondernemer, reason: IAfwijzingReason) => {
    log(`Aanmelding afgewezen voor ${ondernemer.erkenningsNummer}: ${reason.message} ${state.afwijzingen.length}`);

    return {
        ...state,
        afwijzingen: [
            ...state.afwijzingen,
            {
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
            Math.min(
                ondernemer.voorkeur && ondernemer.voorkeur.aantalPlaatsen
                    ? ondernemer.voorkeur.aantalPlaatsen
                    : vastePlaatsen.length,
            ),
        )
        .map(plaats => {
            log(`Wijs ondernemer ${ondernemer.erkenningsNummer} toe aan vaste plaats ${plaats.plaatsId}`);

            return plaats;
        })
        .reduce((state, plaats) => {
            const openPlaats = openPlaatsen.find(openPlaats => openPlaats.plaatsId === plaats.plaatsId);

            if (openPlaats) {
                return assignPlaats(state, createToewijzing(plaats, ondernemer), ondernemer, 'merge');
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
    const { aantalPlaatsen } = ondernemer.voorkeur;
    const { erkenningsNummer } = ondernemer;
    const currentPlaatsen = plaatsen.length;

    const removeFromQueue = (indeling: IMarktindeling, toewijzing: IToewijzing) => ({
        ...indeling,
        expansionQueue: (indeling.expansionQueue || []).filter(t => t !== toewijzing),
    });

    const replaceInQueue = (indeling: IMarktindeling, current: IToewijzing, replacement: IToewijzing) => ({
        ...indeling,
        expansionQueue: indeling.expansionQueue.map(item => (item === current ? replacement : item)),
    });

    if (currentPlaatsen < aantalPlaatsen) {
        const adjacent = getAdjacentPlaatsenForMultiple(indeling, plaatsen);
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

            if (currentPlaatsen + 1 < aantalPlaatsen) {
                // Do You Want More?!!!??!
                indeling = replaceInQueue(indeling, toewijzing, uitbreiding);
            } else {
                indeling = removeFromQueue(indeling, toewijzing);
            }
            // TODO: Merge `toewijzing` and `uitbreiding` objects, add to `indeling`
        } else {
            log(
                `Geen uitbreiding van ${currentPlaatsen} naar ${currentPlaatsen +
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
        plaats = findOptimalSpot(ondernemer, ondernemerVoorkeuren, mogelijkePlaatsen, state);
    }

    if (plaats) {
        return assignPlaats(state, createToewijzing(plaats, ondernemer), ondernemer, 'reassign');
    } else {
        log(`Geen plaats gevonden voor ${ondernemer.erkenningsNummer}`);
        if (handleRejection === 'reject') {
            return rejectOndernemer(state, ondernemer, reason || { message: 'Geen plaats gevonden' });
        } else {
            return state;
        }
    }
};

const calcToewijzingen = (markt: IMarkt & IMarktindelingSeed): IMarktindeling => {
    const { marktplaatsen, ondernemers, voorkeuren, marktId } = markt;
    const { aanwezigheid, aLijst } = markt;

    let aanwezigen = ondernemers.filter(ondernemer => isAanwezig(aanwezigheid, ondernemer));

    log(`${aanwezigheid.filter(rsvp => !rsvp.attending).length} Afmeldingen`);

    const priorities = ['vpl', 'vkk', 'soll'];
    const LOWEST_STATUS_PRIORITY = priorities.length;
    const statusPriority = (status: DeelnemerStatus): number => {
        const index = priorities.indexOf(status);

        return index === -1 ? LOWEST_STATUS_PRIORITY : index;
    };

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

    aanwezigen = [...aanwezigen].sort(ondernemerSort);

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
    const defaultVoorkeuren = aanwezigen
        .filter(({ status }) => isVast(status))
        .map(({ plaatsen, erkenningsNummer }) =>
            (plaatsen || []).map(
                (plaatsId: string): IPlaatsvoorkeur => ({
                    erkenningsNummer,
                    marktId,
                    plaatsId,
                    priority: VOORKEUR_MINIMUM_PRIORITY,
                }),
            ),
        )
        .reduce(flatten, []);

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

    const getPossibleMoves = (state: IMarktindeling, toewijzing: IToewijzing) => {
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

    const move = (state: IMarktindeling, obj: any) =>
        findPlaats(
            state,
            obj.toewijzing.ondernemer,
            0,
            [],
            intersection(obj.beterePlaatsen, state.openPlaatsen),
            'ignore',
        );

    const calculateMoveQueue = (state: IMarktindeling) =>
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

    let moveQueue = calculateMoveQueue(indeling);

    let moveIteration = 0;
    const MOVE_LIMIT = 100;

    for (; moveQueue.length > 0 && moveIteration < MOVE_LIMIT; moveIteration++) {
        log(`Move-queue #${moveIteration}: ${moveQueue.length}`);

        const previousIndeling = indeling;

        indeling = moveQueue.reduce(move, indeling);

        if (previousIndeling === indeling) {
            // Non-essential optimization: nothing changed, so this was the last iteration.
            // This could happen when someone wants to move to an open spot, but something is preventing the move.
            // In this case don't retry the same move until the `MOVE_LIMIT` is exhausted.
            break;
        }

        // TODO: the new `moveQueue` should be created as copy or subset of the existing `moveQueue`,
        // and when all options to move to a better spot have failed and the options are exhausted,
        // the person should not be included in the new queue.
        moveQueue = calculateMoveQueue(indeling);
    }

    indeling = {
        ...indeling,
        expansionQueue: indeling.toewijzingen.filter(
            ({ ondernemer }) =>
                !!ondernemer.voorkeur && ondernemer.voorkeur.aantalPlaatsen > indeling.expansionIteration,
        ),
    };

    while (indeling.expansionIteration <= indeling.expansionLimit) {
        log(
            `Uitbreidingsronde naar ${indeling.expansionIteration} plaatsen (later tot maximaal ${
                indeling.expansionLimit
            })`,
        );

        // TODO: Remove items from expansion queue for which expansion was impossible,
        // skip those in the next iteration.

        indeling = indeling.expansionQueue
            .filter(toewijzing => {
                const { ondernemer, plaatsen } = toewijzing;
                const { aantalPlaatsen } = ondernemer.voorkeur;
                const currentPlaatsen = plaatsen.length;

                return currentPlaatsen < Math.min(aantalPlaatsen, indeling.expansionIteration, indeling.expansionLimit);
            })
            .map(toewijzing => {
                const { ondernemer, plaatsen } = toewijzing;
                const { aantalPlaatsen } = ondernemer.voorkeur;
                const currentPlaatsen = plaatsen.length;

                log(
                    `Ondernemer ${
                        ondernemer.erkenningsNummer
                    } wil ${aantalPlaatsen} plaatsen, en heeft nu ${currentPlaatsen} plaats(en)`,
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

if (typeof module !== 'undefined' && module && module.exports) {
    module.exports = {
        calcToewijzingen,
    };
}

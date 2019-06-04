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
 * Example usage: [1, 2, 1, 2, 3].reduce(unique, [])
 */
const unique = <T>(a: T[], b: T): T[] => (a.includes(b) ? a : [...a, b]);

const count = <T>(arrayMaybe: T | T[]): number =>
    arrayMaybe ? (Array.isArray(arrayMaybe) ? arrayMaybe.length : 1) : 0;

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

const logOpenPlaatsen = (indeling: IMarktindeling) => console.log(`Nog ${indeling.openPlaatsen.length} vrije plaatsen`);

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

const findOptimalSpot = (
    ondernemer: IMarktondernemer,
    voorkeuren: IPlaatsvoorkeur[],
    openPlaatsen: IMarktplaats[],
    branches: IBranche[],
) => {
    let mogelijkePlaatsen = openPlaatsen;

    // console.debug(`Vind een plaats voor ${ondernemer.id}`);

    const ondernemerBranches = (ondernemer.branches || []).map(brancheId =>
        branches.find(b => b.brancheId === brancheId),
    );

    mogelijkePlaatsen = ondernemerBranches.reduce(
        (mogelijkePlaatsen: IMarktplaats[], branche: IBranche): IMarktplaats[] => {
            if (branche.verplicht) {
                /*
                 * Bijvoorbeeld: als de ondernemer een wil frituren (`{ "branche": "bak" }`)
                 * dan blijven alleen nog de kramen over waarop frituren is toegestaan.
                 */
                mogelijkePlaatsen = mogelijkePlaatsen.filter(plaats =>
                    plaats.branches.find(brancheId => brancheId === branche.brancheId),
                );
                console.debug(
                    `Filter op branche: ${branche.brancheId} (${mogelijkePlaatsen.length}/${openPlaatsen.length} over)`,
                );
            } else {
                console.debug(`Sorteer op branche: ${branche.brancheId}`);
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

    // voorkeuren.sort((a, b) => numberSort(a.priority, b.priority));

    mogelijkePlaatsen.sort((a, b) => {
        const voorkeurA = voorkeuren.find(voorkeur => voorkeur.plaatsId === a.plaatsId);
        const voorkeurB = voorkeuren.find(voorkeur => voorkeur.plaatsId === b.plaatsId);

        const prioA = voorkeurA ? voorkeurA.priority : VOORKEUR_MINIMUM_PRIORITY;
        const prioB = voorkeurB ? voorkeurB.priority : VOORKEUR_MINIMUM_PRIORITY;

        return numberSort(-prioA, -prioB);
    });

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

    const plaats = state.marktplaatsen.find(plaats => toewijzing.plaatsen.includes(plaats.plaatsId));

    if (plaats) {
        console.log(`Verwijder toewijzing van ${toewijzing.erkenningsNummer} aan ${toewijzing.plaatsen}`);

        return {
            ...state,
            toewijzingen: toewijzingen.filter(t => t !== toewijzing),
            openPlaatsen: [...openPlaatsen, plaats],
        };
    } else {
        return state;
    }
};

const findToewijzing = (state: IMarktindeling, ondernemer: IMarktondernemer) =>
    state.toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === ondernemer.erkenningsNummer);

const addToewijzing = (state: IMarktindeling, toewijzing: IToewijzing): IMarktindeling => ({
    ...state,
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
    console.debug(`Plaats toegewezen aan ${ondernemer.erkenningsNummer}: ${toewijzing.plaatsen}`, toewijzing);
    const existingToewijzing = findToewijzing(state, ondernemer);

    let newToewijzing = {
        plaatsen: [...toewijzing.plaatsen],
        erkenningsNummer: ondernemer.erkenningsNummer,

        // For convenience, access to the full object
        ondernemer,
    };

    if (existingToewijzing) {
        console.log(
            `Ondernemer is reeds toegwezen aan plaats(en): ${existingToewijzing.plaatsen.join('/')}`,
            toewijzing,
        );

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
    console.debug(
        `Aanmelding afgewezen voor ${ondernemer.erkenningsNummer}: ${reason.message} ${state.afwijzingen.length}`,
    );

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

    const vastePlaatsen = ondernemer.plaatsen
        .map(vastePlaatsId => openPlaatsen.find(({ plaatsId }) => plaatsId === vastePlaatsId))
        .filter(Boolean);

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
        .map(plaats => {
            console.log(`Wijs ondernemer ${ondernemer.erkenningsNummer} toe aan vaste plaats ${plaats.plaatsId}`);

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

    console.log(`Ondernemer wil ${aantalPlaatsen} plaatsen, en heeft nu ${currentPlaatsen} plaats(en)`);

    if (aantalPlaatsen > currentPlaatsen) {
        const adjacent = getAdjacentPlaatsenForMultiple(indeling, plaatsen);
        console.log(
            `Er zijn ${adjacent.length} aanliggende plaatsen voor ${plaatsen}: ${adjacent
                .map(({ plaatsId }) => plaatsId)
                .join('/')}`,
        );

        const uitbreidingPlaats = findOptimalSpot(ondernemer, indeling.voorkeuren, adjacent, indeling.branches);

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

            console.log(`Ondernemer kan uitbreiden naar ${uitbreidingPlaats.plaatsId}`, toewijzing, uitbreiding);

            indeling = replaceToewijzing(indeling, toewijzing, uitbreiding);

            if (currentPlaatsen + 1 < aantalPlaatsen) {
                // Do You Want More?!!!??!
                indeling = {
                    ...indeling,
                    expansionQueue: [...(indeling.expansionQueue || []), toewijzing],
                };
            }
            // TODO: Merge `toewijzing` and `uitbreiding` objects, add to `indeling`
        } else {
            console.log(
                `Geen uitbreiding van ${currentPlaatsen} naar ${currentPlaatsen +
                    1} plaatsen voor ondernemer ${erkenningsNummer}`,
            );
        }
    }

    return indeling;
};

const heeftVastePlaatsen = (ondernemer: IMarktondernemer): boolean =>
    isVast(ondernemer.status) && count(ondernemer.plaatsen) > 0;

const findPlaats = (state: IMarktindeling, ondernemer: IMarktondernemer): IMarktindeling => {
    const { openPlaatsen } = state;

    const ondernemerVoorkeuren = state.voorkeuren.filter(
        voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer,
    );

    let reason;

    if (openPlaatsen.length === 0) {
        reason = FULL_REASON;
    }

    const brancheLimitsExceeded = (ondernemer.branches || []).filter(ondernemerBranche => {
        const brancheDefinition = (state.branches || []).find(({ brancheId }) => brancheId === ondernemerBranche);

        const brancheMaximum =
            !!brancheDefinition && typeof brancheDefinition.maximum === 'number' ? brancheDefinition.maximum : Infinity;

        if (brancheMaximum < Infinity) {
            const currentUsage = state.toewijzingen.filter(toewijzing =>
                (toewijzing.ondernemer.branches || []).includes(ondernemerBranche),
            ).length;

            console.log(`${currentUsage}/${brancheMaximum} plaatsen in branche ${ondernemerBranche} toegewezen`);
        }

        return (
            state.toewijzingen.filter(toewijzing => (toewijzing.ondernemer.branches || []).includes(ondernemerBranche))
                .length >= brancheMaximum
        );
    });

    if (brancheLimitsExceeded.length > 0) {
        reason = BRANCHE_FULL_REASON;
    }

    logOpenPlaatsen(state);

    console.log(`Ondernemer ${ondernemer.erkenningsNummer} heeft ${ondernemerVoorkeuren.length} voorkeuren genoemd`);

    let plaats;

    if (!reason) {
        plaats = findOptimalSpot(ondernemer, ondernemerVoorkeuren, openPlaatsen, state.branches);
    }

    if (plaats) {
        return assignPlaats(state, createToewijzing(plaats, ondernemer), ondernemer, 'reassign');
    } else {
        console.debug(`Geen plaats gevonden voor ${ondernemer.erkenningsNummer}`);

        return rejectOndernemer(state, ondernemer, reason);
    }
};

const calcToewijzingen = (markt: IMarkt & IMarktindelingSeed): IMarktindeling => {
    const { marktplaatsen, ondernemers, voorkeuren } = markt;
    const { aanwezigheid, aLijst } = markt;

    const aanwezigen = ondernemers.filter(ondernemer => isAanwezig(aanwezigheid, ondernemer));

    console.debug(`${aanwezigheid.filter(rsvp => !rsvp.attending).length} Afmeldingen`);

    const priorities = ['vpl', 'vkk', 'soll'];
    const LOWEST_STATUS_PRIORITY = priorities.length;
    const statusPriority = (status: DeelnemerStatus): number => {
        const index = priorities.indexOf(status);

        return index === -1 ? LOWEST_STATUS_PRIORITY : index;
    };

    const abLijstPriority = (ondernemer: IMarktondernemer): number => (aLijst.includes(ondernemer) ? 1 : 2);

    aanwezigen.sort((a, b) => {
        // A-lijst of B-lijst
        const sort1 = numberSort(abLijstPriority(a), abLijstPriority(b));

        // Vastekaarthouders, tijdelijkevasteplaatshouders, sollicitanten
        const sort2 = numberSort(statusPriority(a.status), statusPriority(b.status));

        // Ancienniteitsnummer
        const sort3 = numberSort(a.sollicitatieNummer, b.sollicitatieNummer);

        return sort1 || sort2 || sort3;
    });

    console.debug(
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
                    marktId: markt.id,
                    plaatsId,
                    priority: VOORKEUR_MINIMUM_PRIORITY,
                }),
            ),
        )
        .reduce(flatten, []);

    console.log('Voorkeuren volgens de herindeling: ', defaultVoorkeuren);

    const initialState: IMarktindeling = {
        ...markt,
        expansionQueue: [],
        afwijzingen: [],
        toewijzingen: [],
        openPlaatsen: [...marktplaatsen.filter(plaats => !plaats.inactive)],
        voorkeuren: [...defaultVoorkeuren, ...voorkeuren],
    };

    /*
     * stap 1:
     * beperkt de indeling tot kramen met een toewijzingsbeperking (branche, eigen materieel)
     * en ondernemers met een bijbehorende eigenschap
     */
    const brancheKramen = initialState.openPlaatsen.filter(plaats => count(plaats.branches) > 0);
    const brancheOndernemers = aanwezigen.filter(ondernemer => count(ondernemer.branches) > 0);

    console.log(`Branche-kramen: ${brancheKramen.length}`);
    console.log(`Branche-ondernemers: ${brancheOndernemers.length}`);

    const vastePlaatsenQueue = aanwezigen.filter(heeftVastePlaatsen);

    console.log(`Vasteplaatshouders eerst: ${vastePlaatsenQueue.length}`);

    let indeling = vastePlaatsenQueue.reduce(assignVastePlaats, initialState);

    indeling = aanwezigen.filter(ondernemer => !heeftVastePlaatsen(ondernemer)).reduce(findPlaats, indeling);

    const expansionQueue = indeling.toewijzingen.filter(
        ({ ondernemer }) => !!ondernemer.voorkeur && ondernemer.voorkeur.aantalPlaatsen > 1,
    );

    indeling = expansionQueue.reduce(assignUitbreiding, indeling);

    /*
    console.warn(
        `Na mogelijkheid tot uitbreiding zijn er nog ${
            indeling.expansionQueue.map(({ ondernemer }) => ondernemer).reduce(unique, []).length
        } ondernemers die meer plaatsen willen`,
    );
    */

    indeling = indeling.expansionQueue.reduce(assignUitbreiding, indeling);

    console.log(indeling);

    return indeling;
};

if (typeof module !== 'undefined' && module && module.exports) {
    module.exports = {
        calcToewijzingen,
    };
}

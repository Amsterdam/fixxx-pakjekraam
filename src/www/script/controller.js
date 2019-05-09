const numberSort = (a, b) => (a > b ? 1 : a === b ? 0 : -1);

const findOptimalSpot = (ondernemer, voorkeuren, vrijeKramen, branches) => {
    let mogelijkeKramen = vrijeKramen;

    // console.debug(`Vind een kraam voor ${ondernemer.id}`);

    const branche = ondernemer.branche ? branches.find(b => b.id === ondernemer.branche) : null;

    if (ondernemer.branche && !branche) {
        console.warn(`Onbekende branche: ${ondernemer.branche}`);
    }

    if (branche) {
        if (branche.verplicht) {
            /*
             * Bijvoorbeeld: als de ondernemer een wil frituren (`{ "branche": "bak" }`)
             * dan blijven alleen nog de kramen over waarop frituren is toegestaan.
             */
            mogelijkeKramen = mogelijkeKramen.filter(kraam => kraam.branche === branche.id);
            console.debug(`Filter op branche: ${branche.id} (${mogelijkeKramen.length}/${vrijeKramen.length} over)`);
        } else {
            console.debug(`Sorteer op branche: ${branche.id}`);
            /*
             * Een groenteboer wordt bij voorkeur geplaatst op een plaats in de branch AGF.
             */
            mogelijkeKramen = [...mogelijkeKramen].sort((a, b) => {
                if (a.branche === b.branche) {
                    return 0;
                } else if (a.branche === branche.id) {
                    return -1;
                } else if (b.branche === branche.id) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
    }

    voorkeuren.sort((a, b) => numberSort(a.prioriteit, b.prioriteit));

    mogelijkeKramen.sort((a, b) => {
        let prioA = mogelijkeKramen.findIndex(kraam => kraam.locatie === a.locatie);

        let prioB = mogelijkeKramen.findIndex(kraam => kraam.locatie === a.locatie);

        prioA = prioA === -1 ? Infinity : prioA;
        prioB = prioB === -1 ? Infinity : prioB;

        return numberSort(prioA, prioB);
    });

    return mogelijkeKramen[0];
};

const isAanwezig = (aanmeldingen, ondernemer) => {
    const rsvp = aanmeldingen.find(aanmelding => aanmelding.ondernemer === ondernemer.id);

    /*
     * Vasteplaatshouders die niets hebben laten weten en die hebben bevestigd dat ze
     * komen worden meegeteld als aanwezig. Alleen de expliciete afmeldingen worden
     * niet in overweging genomen in de toedeling van kramen.
     */
    if (ondernemer.status === 'vpl') {
        return !rsvp || rsvp.rsvp === true || rsvp.rsvp === null;
    } else {
        return !!rsvp && rsvp.rsvp === true;
    }
};

const calcToewijzingen = markt => {
    const { aanmeldingen, locaties, ondernemers, voorkeuren, branches } = markt;

    const aanwezigen = ondernemers.filter(ondernemer => {
        const rsvp = aanmeldingen.find(aanmelding => aanmelding.ondernemer === ondernemer.id);

        /*
         * Vasteplaatshouders die niets hebben laten weten en die hebben bevestigd dat ze
         * komen worden meegeteld als aanwezig. Alleen de expliciete afmeldingen worden
         * niet in overweging genomen in de toedeling van kramen.
         */
        if (ondernemer.status === 'vpl') {
            return !rsvp || rsvp.rsvp === true || rsvp.rsvp === null;
        } else {
            return !!rsvp && rsvp.rsvp === true;
        }
    });

    console.log(aanwezigen);
    console.debug(`Aanwezigen: ${aanwezigen.length}/${ondernemers.length}`);

    const initialState = {
        toewijzingen: [],
        vrijeKramen: [...locaties.filter(kraam => !kraam.inactive)],
    };

    const toewijzingen = aanwezigen.reduce((state, ondernemer) => {
        const ondernemerVoorkeuren = voorkeuren.filter(voorkeur => voorkeur.ondernemer === ondernemer.id);

        const toewijzing = findOptimalSpot(ondernemer, ondernemerVoorkeuren, state.vrijeKramen, branches);

        if (toewijzing) {
            console.debug(`Kraam toegewezen aan ${ondernemer.id}: ${toewijzing.locatie}`);
        }

        return {
            ...state,
            vrijeKramen: state.vrijeKramen.filter(kraam => !toewijzing || kraam.locatie !== toewijzing.locatie),
            toewijzingen: [
                ...state.toewijzingen,
                ...(toewijzing
                    ? [
                          {
                              kraam: toewijzing.locatie,
                              ondernemer: ondernemer.id,
                          },
                      ]
                    : []),
            ],
        };
    }, initialState);

    return toewijzingen.toewijzingen;
};

const SOLLICITANT_KANS_AANWEZIG = 0.5;
const VPH_KANS_OP_AFWEZIG = 0.3;

const MINIMALE_PRIORITEIT = 1;
const MAXIMALE_PRIORITEIT = 1000; // Maximum aantal voorkeuren

const simulateAanmeldingen = markt => {
    const aanmeldingen = [
        ...markt.aanmeldingen,

        // Randomize circa 30% afmeldingen van vasteplaatshouders
        ...markt.ondernemers
            .filter(o => o.status === 'vpl')
            .map(o => ({
                ondernemer: o.id,
                datum: new Date().toISOString(),
                rsvp: Math.random() >= VPH_KANS_OP_AFWEZIG,
            }))
            .filter(o => o.rsvp === false),

        // Randomize aanmeldingen van 50% van de sollicitanten
        ...markt.ondernemers
            .filter(o => o.status === 'soll')
            .map(soll => ({
                ondernemer: soll.id,
                datum: new Date().toISOString(),
                rsvp: Math.random() >= SOLLICITANT_KANS_AANWEZIG,
            })),
    ];

    const defaultVoorkeuren = markt.ondernemers
        .filter(o => o.status === 'vpl')
        .map(o => ({
            ondernemer: o.id,
            locatie: o.locatie,
            prioriteit: MINIMALE_PRIORITEIT,
        }));

    const voorkeuren = [...defaultVoorkeuren, ...markt.voorkeuren];

    return {
        ...markt,
        aanmeldingen,
    };
};

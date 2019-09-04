const { calcToewijzingen } = require('./indeling.ts');
const { marktScenario } = require('./indeling-scenario.ts');


/* eslint-disable no-magic-numbers */

const FIRST_CHOICE = Number.MAX_SAFE_INTEGER;
const SECOND_CHOICE = FIRST_CHOICE - 1;
const THIRD_CHOICE = FIRST_CHOICE - 2;

function calc(callback) {
    const markt = marktScenario(callback);
    return calcToewijzingen(markt);
}
function findPlaatsen(toewijzingen, sollicitatieNummer) {
    const ond = toewijzingen.find(({ ondernemer }) => ondernemer.sollicitatieNummer === sollicitatieNummer);
    return ond ? ond.plaatsen.sort() : [];
}
function isRejected(afwijzingen, sollicitatieNummer) {
    return afwijzingen.some(({ ondernemer }) => ondernemer.sollicitatieNummer === sollicitatieNummer);
}

describe('Een ondernemer die ingedeeld wil worden', () => {
    it('wordt toegewezen aan een lege plek', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer()],
            marktplaatsen: [plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
    });

    it('komt niet op een inactieve marktplaats', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 2 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1'] }), ondernemer()],
            marktplaatsen: [plaats({ inactive: true })]
        }));

        expect(toewijzingen.length).toBe(0);
        expect(afwijzingen.length).toBe(2);
    });

    it('kan kiezen niet te worden ingedeeld op willekeurige plaatsen', () => {
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ voorkeur: { anywhere: false, maximum: 3 } }),
                ondernemer({ voorkeur: { anywhere: false } })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '2' })
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);
    });

    it('wordt toegewezen aan zijn vaste plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['2'] })],
            marktplaatsen: [plaats(), plaats()]
        }));
        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });

    it('wordt toegewezen aan zijn vaste plaatsen', () => {
        /*
         * Scenario:
         * - 4 marktplaatsen
         * - 1 ondernemer met een meervoudige plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['2', '3', '4'] })],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3', '4']);
    });

    it('krijgt hetzelfde aantal willekeurige plaatsen als zijn vaste plaatsen niet beschikbaar zijn', () => {
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }),
                ondernemer()
            ],
            marktplaatsen: [
                plaats({ inactive: true }), plaats({ inactive: true }),
                plaats(), plaats()
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4']);
    });

    it('kan zijn aantal vaste plaatsen verkleinen door een maximum in te stellen', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een meervoudige plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'], voorkeur: { maximum: 1 } })],
            marktplaatsen: [plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '1', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });

    it('komt op een standwerkerplaats als hij standwerker is', () => {
        /*
         * Scenario:
         * - 1 marktplaats met branche
         * - 1 ondernemer met hoge anceniteit zonder branche
         * - 1 ondernemer met lage anceniteit en branchetoewijzing
         */

        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, voorkeur: { branches: ['standwerker'] } }),
                ondernemer({ sollicitatieNummer: 2, voorkeur: { branches: ['standwerker'] } })
            ],
            marktplaatsen: [plaats(), plaats({ branches: ['standwerker'] })],
            branches: [{
                brancheId: 'standwerker', verplicht: true
            }]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });

    it('wordt afgewezen als de markt vol is', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 2 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 99 }),
                ondernemer({ sollicitatieNummer: 42 })
            ],
            marktplaatsen: [plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 42)).toStrictEqual(['1']);
        expect(isRejected(afwijzingen, 99)).toBe(true);
    });

    it('krijgt geen dagvergunning indien het maximum aantal branche-plaatsen worden overschreden ', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers met dezelfde branchetoewijzing
         * - de markt staat maximaal 1 ondernemer toe met deze branchetoewijzing
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 99, voorkeur: { branches: ['branche-x'] } }),
                ondernemer({ sollicitatieNummer: 42, voorkeur: { branches: ['branche-x'] } })
            ],
            marktplaatsen: [plaats(), plaats()],
            branches: [
                {
                    brancheId: 'branche-x',
                    maximumPlaatsen: 1
                }
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 42)).toStrictEqual(['1']);
        expect(isRejected(afwijzingen, 99)).toBe(true);
    });

    it('krijgt geen dagvergunning indien het maximum aantal branche-ondernemers wordt overschreden ', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers met dezelfde branchetoewijzing
         * - de markt staat maximaal 1 ondernemer toe met deze branchetoewijzing
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 99, voorkeur: { branches: ['branche-x'] } }),
                ondernemer({ sollicitatieNummer: 42, voorkeur: { branches: ['branche-x'] } })
            ],
            marktplaatsen: [plaats(), plaats()],
            branches: [{
                brancheId: 'branche-x',
                maximumToewijzingen: 1
            }]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 42)).toStrictEqual(['1']);
        expect(isRejected(afwijzingen, 99)).toBe(true);
    });
});

describe('Een ondernemer krijgt voorkeur', () => {
    it('over sollicitanten als zij VPH zijn', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer met hoge anceniteit zonder vaste plaats
         * - 1 ondernemer met lagere anceniteit en vaste plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, status: 'soll' }),
                ondernemer({ sollicitatieNummer: 99, status: 'vpl' })
            ],
            marktplaatsen: [plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 99)).toStrictEqual(['1']);
    });

    it('over sollicitanten als zij VKK zijn', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer met hoge anceniteit zonder vaste plaats
         * - 1 ondernemer met lagere anceniteit en tijdelijke vaste plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, status: 'soll' }),
                ondernemer({ sollicitatieNummer: 99, status: 'vkk' })
            ],
            marktplaatsen: [plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 99)).toStrictEqual(['1']);
    });

    it('over andere VPHs op hun toegewezen plaats(en) indien zij VPH of VKK zijn', () => {
        /*
         * Scenario:
         * - 5 marktplaatsen
         * - 2 ondernemer met lage anceniteit maar met vaste plaatsen
         * - 3 ondernemers met hoge anceniteit die ook graag op de vaste plaatsen willen staan
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl' }),
                ondernemer({ sollicitatieNummer: 2, status: 'vkk' }),
                ondernemer({ sollicitatieNummer: 3, status: 'soll' }),
                ondernemer({ sollicitatieNummer: 4, status: 'vkk', plaatsen: ['2'] }),
                ondernemer({ sollicitatieNummer: 5, status: 'vpl', plaatsen: ['1'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '1' }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '2' })
            ]
        }));

        expect(toewijzingen.length).toBe(5);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 4)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 5)).toStrictEqual(['1']);
    });

    it('als zij een brancheplek willen', () => {
        /*
         * Scenario:
         * - 1 marktplaats met branche
         * - 1 ondernemer met hoge anceniteit zonder branche
         * - 1 ondernemer met lage anceniteit en branchetoewijzing
         */

        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42 }),
                ondernemer({ sollicitatieNummer: 99, voorkeur: { branches: ['branche-x'] } })
            ],
            marktplaatsen: [plaats({ branches: ['branche-x'] })]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 99)).toStrictEqual(['1']);
    });

    it('als zij eigen materieel hebben', () => {
        /*
         * Scenario:
         * - 1 marktplaats met eigen materieel voorkeur
         * - 1 ondernemer met hoge anceniteit zonder eigen materieel
         * - 1 ondernemer met lage anceniteit met eigen materieel
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42 }),
                ondernemer({ sollicitatieNummer: 99, voorkeur: { verkoopinrichting: ['eigen-materieel'] } })
            ],
            marktplaatsen: [plaats({ verkoopinrichting: ['eigen-materieel'] })]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 99)).toStrictEqual(['1']);
        expect(isRejected(afwijzingen, 42));
    });

    it('als zij op de A-lijst staan', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer op de A-lijst met lage anceniteit
         * - 1 ondernemer niet op de A-lijst met hoge anceniteit
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42 }),
                ondernemer({ sollicitatieNummer: 99 })
            ],
            marktplaatsen: [plaats()],
            aLijst: [ondernemer({ sollicitatieNummer: 99 })]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 99)).toStrictEqual(['1']);
        expect(isRejected(afwijzingen, 42)).toBe(true);
    });
});

describe('Een vasteplaatshouder die wil verplaatsen', () => {
    it('wordt enkel verplaatst als zij genoeg voorkeuren hebben opgegeven', () => {
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, aanmelding, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['4'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '5', priority: FIRST_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['5']);
    });

    it('mag dit voor sollicitanten worden ingedeeld', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met vaste plaats is toegekend aan de eerste plaats
         *   en heeft een voorkeur geuit om op tweede plaats te staan
         * - 1 sollicitant wil ook graag op de tweede plaats staan
         */

        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, aanmelding, voorkeur }) => ({
            ondernemers: [ondernemer(), ondernemer({ plaatsen: ['1'], status: 'vpl' })],
            marktplaatsen: [plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2' }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '2' })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2']);
    });

    it('kan altijd verplaatsen naar een losse plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met vaste plaats is toegekend aan de eerste plaats
         *   en heeft een voorkeur geuit om op tweede plaats te staan
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] })
            ],
            marktplaatsen: [plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2' })
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });

    it('mag niet naar een plaats van een andere aanwezige VPH', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] })
            ],
            marktplaatsen: [plaats(), plaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 1, plaatsId: '2' })]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2']);
    });

    it('mag naar een plaats van een afwezige VPH', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met vaste plaats is toegekend aan de eerste plaats
         *   en heeft een voorkeur geuit om op tweede plaats te staan
         */

        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, aanmelding, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, plaatsen: ['2'], status: 'vpl' }),
                ondernemer({ sollicitatieNummer: 99 })
            ],
            aanwezigheid: [
                aanmelding({ sollicitatieNummer: 42, attending: false }),
                aanmelding({ sollicitatieNummer: 99, attending: true })
            ],
            marktplaatsen: [plaats(), plaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 99, plaatsId: '2' })]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 99)).toStrictEqual(['2']);
    });

    it('mag ruilen met een andere VPH', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ status: 'vpl', plaatsen: ['2'] })
            ],
            marktplaatsen: [plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2' }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '1' })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });

    it('mag indirect van plaats ruilen met een andere VPH', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });

    it('kan geblokkeerd worden in een ruil door een VPH met anciënniteit', () => {
        /*
         * Scenario:
         * - 4 marktplaatsen
         * - 3 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3'] }),
                ondernemer({ sollicitatieNummer: 3, status: 'vpl', plaatsen: ['2'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 3, plaatsId: '1', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 3, plaatsId: '3', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(3);
        expect(afwijzingen.length).toBe(0);

        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 3)).toStrictEqual(['2']);
    });

    it('kan verschuiven naar een plek die vrij komt', () => {
        /*
         * Scenario:
         * - 3 ondernemers
         * - 2 ondernemers (1e en 3e anceniteit) kunnen direct verschuiven
         * - wanneer de ondernemer met 1e anceniteit verschuift, komt de plek vrij waar ondernemer 2 en 3 ook graag naar toe willen
         * - de tweede ondernemer heeft meer recht dan de ondernemer die in eerste instantie al kon verschuiven
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] }),
                ondernemer({ sollicitatieNummer: 3, status: 'vpl', plaatsen: ['3'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '4', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 3, plaatsId: '1', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 3, plaatsId: '5', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(3);

        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['4']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 3)).toStrictEqual(['5']);
    });

    it('kan naar een vrijgekomen plaats van een andere VPH', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2' }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '3' })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3']);
    });

    it('met meerdere plaatsen behoudt dit aantal na verplaatsing', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met vaste plaats is toegekend aan de eerste plaats
         *   en heeft een voorkeur geuit om op tweede plaats te staan
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '5', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '6', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '5', priority: FIRST_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['5', '6']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3']);
    });

    it('met meerdere plaatsen blijft staan als onvoldoende voorkeuren vrij zijn', () => {
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3']);
    });
});

describe('Een ondernemer die wil uitbreiden', () => {
    it('kan een tweede plaats krijgen', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 2 } })],
            marktplaatsen: [plaats(), plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
    });

    it('kan 3 plaatsen krijgen', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een meervoudige plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 3 } })],
            marktplaatsen: [plaats(), plaats(), plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2', '3']);
    });

    it('kan niet verder vergroten dan is toegestaan', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een meervoudige plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 3 } })],
            marktplaatsen: [plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '1', priority: THIRD_CHOICE })
            ],
            expansionLimit: 2
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);
    });

    it('kan een minimum aantal gewenste plaatsen opgeven', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { minimum: 2 } })],
            marktplaatsen: [plaats(), plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
    });

    it('kan dat niet indien het maximum aantal branche-plaatsen wordt overschreden', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemers met branchetoewijzing, wil 3 plaatsen
         * - de markt staat maximaal 2 plaatsen toe met deze branchetoewijzing
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 3, branches: ['branche-x'] } })],
            marktplaatsen: [plaats(), plaats(), plaats()],
            branches: [{
                brancheId: 'branche-x',
                maximumPlaatsen: 2
            }]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
    });

    it('kan niet uitbreiden naar een andere marktkraamrij', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen gescheiden door een straat
         * - 1 ondernemer met een voorkeur voor 2 kramen
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 2 } })],
            marktplaatsen: [plaats(), plaats()],
            rows: [['1'], ['2']]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
    });

    it('wordt ingedeeld bij de voorkeurszijde, indien zijn kunnen uitbreiden aan beide zijdes', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een vaste plek op de middelste kraam
         * - de ondernemer heeft een voorkeur voor kraam 2, daarna 1, daarna 3
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 2 } })],
            marktplaatsen: [plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);
    });

    it.skip('Ondernemers die kunnen uitbreiden aan verschillende zijden, wordt ingedeeld bij de voorkeurszijde', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een vaste plek op de middelste kraam
         * - de ondernemer heeft een voorkeur voor kraam 2, daarna 1, daarna 3
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ voorkeur: { maximum: 2 } }), ondernemer({ voorkeur: { maximum: 2 } })],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '5', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '4', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['4', '5']);
    });

    it('Ondernemers kunnen eerst uitbreiden naar 2 plaatsen, voordat anderen mogen uitbreiden naar meer plaatsen', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een vaste plek op de middelste kraam
         * - de ondernemer heeft een voorkeur voor kraam 2, daarna 1, daarna 3
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ voorkeur: { maximum: 3 }, plaatsen: ['3', '4'], status: 'vpl' }),
                ondernemer({ voorkeur: { maximum: 2 } })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: THIRD_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '2', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1', '2']);
    });

    it.skip('wordt afgewezen als niet aan zijn minimum voorkeur wordt voldaan', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ voorkeur: { minimum: 2 } })],
            marktplaatsen: [plaats()]
        }));

        expect(toewijzingen.length).toBe(0);
        expect(afwijzingen.length).toBe(1);
    });

    it.skip('Een ondernemer kan kiezen NIET te verschuiven om het minimum aantal plaatsen te krijgen', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ voorkeur: { minimum: 2, anywhere: false } })],
            marktplaatsen: [plaats(), plaats({ inactive: true }), plaats(), plaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '1' }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2' })
            ]
        }));

        expect(toewijzingen.length).toBe(0);
        expect(afwijzingen.length).toBe(1);
    });

    it.skip('Een ondernemer kan kiezen te verschuiven om het minimum aantal plaatsen te krijgen', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ voorkeur: { minimum: 2 } }), ondernemer()],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({
                    sollicitatieNummer: 1,
                    plaatsId: '1'
                }),
                voorkeur({
                    sollicitatieNummer: 2,
                    plaatsId: '2'
                })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2']);
    });
});

describe('Edge cases', () => {
    it.skip('Een vasteplaatshouder niet toegewezen kan worden aan één van de vaste plaatsen', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen, waarvan de middelste tijdelijk buiten gebruik is
         * - 1 ondernemer met een meervoudige plaats, die niet op zijn vaste plaats kan
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1', '2', '3'] })],
            marktplaatsen: [plaats(), plaats({ inactive: true }), plaats()]
        }));

        // TODO: What should happen in this case?
    });

    it('Een vasteplaatshouder wordt voor zover mogelijk toegewezen aan de vaste plaatsen', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ status: 'vpl', plaatsen: ['1', '2'] })
            ],
            marktplaatsen: [
                plaats({ inactive: true }), plaats()
            ]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(toewijzingen[0].plaatsen).toStrictEqual(['2']);

        /*
         * TODO: Decide if there should be afwijzing too?
         * expect(afwijzingen.length).toBe(1);
         */
    });

    it.skip('Een ondernemer wordt gecompenseerd voor een (tijdelijk) inactieve vaste plaats', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         * - 1 sollicitant
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }),
                ondernemer()
            ],
            marktplaatsen: [plaats({ inactive: true }), plaats(), plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);

        // TODO: Should we expect a (partial) reject for the vasteplaatshouder?
        expect(afwijzingen.length).toBe(1);
    });

    it.skip('Een vasteplaatshouder krijgt bij verplaatsing het vaste aantal plaatsen', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['3', '4'] })
            ],
            marktplaatsen: [plaats(), plaats(), plaats({ inactive: true }), plaats()]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);

        /*
         * TODO: Decide if there should be afwijzing too?
         * expect(afwijzingen.length).toBe(1);
         */
    });

    it('Een ondernemer kan uitbreiden in een cirkelvormige marktoptstelling', () => {
        /*
         * Scenario:
         * - 4 marktplaatsen, waarvan 2 brancheplaatsen
         * - 2 marktondernemers, waarvan 1 in deze branche
         * - beide ondernemers willen uitbreiden naar dezelfde brancheplaats in het midden,
         *   en de ondernemer zonder branche heeft betere anceniteit
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ voorkeur: { maximum: 3 } })],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()],
            voorkeuren: [
                voorkeur({
                    sollicitatieNummer: 1,
                    plaatsId: '4',
                    priority: FIRST_CHOICE
                }),
                voorkeur({
                    sollicitatieNummer: 1,
                    plaatsId: '1',
                    priority: SECOND_CHOICE
                }),
                voorkeur({
                    sollicitatieNummer: 1,
                    plaatsId: '2',
                    priority: THIRD_CHOICE
                })
            ],
            rows: [['1', '2', '3', '4', '1']]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2', '4']);
    });

    it.skip('Een branche-ondernemer krijgt voorkeur bij uitbreiden naar een brancheplaats', () => {
        /*
         * Scenario:
         * - 4 marktplaatsen, waarvan 2 brancheplaatsen
         * - 2 marktondernemers, waarvan 1 in deze branche
         * - beide ondernemers willen uitbreiden naar dezelfde brancheplaats in het midden,
         *   en de ondernemer zonder branche heeft betere anceniteit
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 2 } }),
                ondernemer({ sollicitatieNummer: 2, voorkeur: { maximum: 2, branches: ['branche-x'] } })
            ],
            marktplaatsen: [
                plaats(),
                plaats(),
                plaats({ branches: ['branche-x'] }),
                plaats({ branches: ['branche-x'] })
            ],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2', priority: SECOND_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '4', priority: FIRST_CHOICE }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '3', priority: SECOND_CHOICE })
            ]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3', '4']);
    });

    it.skip('Zoveel mogelijk ondernemers kunnen marktplaatsen uitbreiden', () => {
        /*
         * Scenario:
         * - 2 marktrijen met elk 2 marktplaatsen
         * - 2 ondernemers met een voorkeur voor 2 kramen
         */
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 2 } }),
                ondernemer({ sollicitatieNummer: 2, voorkeur: { maximum: 2 } })
            ],
            marktplaatsen: [plaats(), plaats(), plaats(), plaats()],
            rows: [['1', '2'], ['3', '4']]
        }));

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3', '4']);
    });

    it('Een ondernemer kan niet uitbreiden wanneer een obstakel dat blokeert', () => {
        const { toewijzingen, afwijzingen } = calc(({ ondernemer, plaats, voorkeur }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 1, voorkeur: { maximum: 2 } })],
            marktplaatsen: [plaats(), plaats()],
            obstakels: [{ kraamA: '1', kraamB: '2', obstakel: ['boom'] }]
        }));

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
    });
});

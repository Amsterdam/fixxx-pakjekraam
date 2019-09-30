/* eslint-disable no-magic-numbers */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-redeclare */

const { calcToewijzingen } = require('./indeling.ts');
const { marktScenario } = require('./indeling-scenario.ts');

const { pluck } = require('./util.ts');

const FIRST_CHOICE = Number.MAX_SAFE_INTEGER;
const SECOND_CHOICE = FIRST_CHOICE - 1;
const THIRD_CHOICE = FIRST_CHOICE - 2;

function calc(def) {
    const markt = marktScenario(def);
    return calcToewijzingen(markt);
}
function findPlaatsen(toewijzingen, sollicitatieNummer) {
    const ond = toewijzingen.find(({ ondernemer }) =>
        ondernemer.sollicitatieNummer === sollicitatieNummer
    );
    return ond ?
           ond.plaatsen.sort((a, b) => Number(a) - Number(b)) :
           ['Ondernemer niet gevonden in toewijzingen'];
}
function findOndernemers(wijzingen) {
    return wijzingen.map(({ ondernemer }) => ondernemer.sollicitatieNummer).sort();
}
function isRejected(afwijzingen, sollicitatieNummer) {
    return afwijzingen.some(({ ondernemer }) => ondernemer.sollicitatieNummer === sollicitatieNummer);
}

describe('Een ondernemer die ingedeeld wil worden', () => {
    it('wordt toegewezen aan een lege plek', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [{}],
            marktplaatsen: [{}]
        });

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
    });

    it('komt niet op een inactieve marktplaats', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] },
                { sollicitatieNummer: 2 }
            ],
            marktplaatsen: [{ inactive: true }]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1, 2]);
    });

    it('komt op een standwerkerplaats als hij standwerker is', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { branches: ['standwerker'] } },
                { sollicitatieNummer: 2, voorkeur: { branches: ['standwerker'] } }
            ],
            marktplaatsen: [
                {}, { branches: ['standwerker'] }
            ],
            branches: [{
                brancheId: 'standwerker', verplicht: true
            }]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });
});

describe('Een ondernemer wordt afgewezen', () => {
    it('als de markt vol is', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 2 },
                { sollicitatieNummer: 1 }
            ],
            marktplaatsen: [{}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
    });

    it('als het maximum aantal branche-ondernemers wordt overschreden ', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 99, voorkeur: { branches: ['branche-x'] } },
                { sollicitatieNummer: 42, voorkeur: { branches: ['branche-x'] } }
            ],
            marktplaatsen: [{}, {}],
            branches: [{
                brancheId: 'branche-x',
                maximumToewijzingen: 1
            }]
        });

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 42)).toStrictEqual(['1']);
        expect(isRejected(afwijzingen, 99)).toBe(true);
    });
});

describe('Een VPH die ingedeeld wil worden', () => {
    it('krijgt voorkeur boven sollicitanten', () => {
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'soll' },
                { sollicitatieNummer: 2, status: 'vpl' }
            ],
            marktplaatsen: [{}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);

        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'soll' },
                { sollicitatieNummer: 2, status: 'vkk' }
            ],
            marktplaatsen: [{}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });

    it('wordt toegewezen aan zijn vaste plaats(en)', () => {
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2', '3', '4'] }
            ],
            marktplaatsen: [
                {}, {}, {}, {}
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2', '3', '4']);

        // Ondernemers 1 en 2 mogen eerder kiezen, maar krijgen niet de
        // plaatsen van ondernemers 3 en 4.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['3'] },
                { sollicitatieNummer: 2, status: 'vkk', plaatsen: ['4'] },
                { sollicitatieNummer: 3, status: 'vkk', plaatsen: ['2'] },
                { sollicitatieNummer: 4, status: 'vpl', plaatsen: ['1'] }
            ],
            marktplaatsen: [{}, {}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '1' },
                { sollicitatieNummer: 2, plaatsId: '2' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2, 3, 4]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 3)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 4)).toStrictEqual(['1']);
    });

    it('kan zijn aantal vaste plaatsen verkleinen door een maximum in te stellen', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'], voorkeur: { maximum: 1 } }
            ],
            marktplaatsen: [{}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '1', priority: SECOND_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });

    it('wordt afgewezen als zijn vaste plaatsen niet beschikbaar zijn', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3', '4'], voorkeur: { minimum: 1 } },
                { sollicitatieNummer: 3, status: 'vpl', plaatsen: ['5', '6'] },
            ],
            marktplaatsen: [
                { inactive: true }, {},
                { inactive: true }, {},
                { inactive: true }, {},
                {}, {}
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2, 3]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['4']);
        expect(findPlaatsen(toewijzingen, 3)).toStrictEqual(['6', '7']);
    });

    // Uitgezet, omdat nog niet besloten is hoe om te gaan met 'willekeurig indelen' voor VPH.
    it.skip('kan hetzelfde aantal willekeurige plaatsen krijgen als zijn eigen plaatsen niet beschikbaar zijn', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'], voorkeur: { anywhere: true } },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3', '4'] }
            ],
            marktplaatsen: [
                { inactive: true }, { inactive: true },
                { inactive: true }, { inactive: true },
                {}, {},
                {}, {}
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['5', '6']);
    });
});

describe('Een VPH die niet ingedeeld wil worden', () => {
    it('kan zijn aanwezigheid voor een bepaalde periode uitschakelen', () => {
        const { toewijzingen, afwijzingen, openPlaatsen } = calc({
            marktDate: '2019-02-01',
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'], voorkeur: {
                    absentFrom: new Date('2019-01-29'),
                    absentUntil: new Date('2019-02-02')
                } },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'], voorkeur: {
                    absentFrom: new Date('2019-01-29'),
                    absentUntil: new Date('2019-02-01')
                } },
                { sollicitatieNummer: 3, status: 'vpl', plaatsen: ['3'], voorkeur: {
                    absentFrom: new Date('2019-02-01'),
                    absentUntil: new Date('2019-02-03')
                } },
                { sollicitatieNummer: 4, status: 'vpl', plaatsen: ['4'], voorkeur: {
                    absentFrom: new Date('2019-01-29'),
                    absentUntil: new Date('2019-01-31')
                } },
                { sollicitatieNummer: 5, status: 'vpl', plaatsen: ['5'], voorkeur: {
                    absentFrom: new Date('2019-02-02'),
                    absentUntil: new Date('2019-02-03')
                } }
            ],
            marktplaatsen: [{}, {}, {}, {}, {}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([4, 5]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(pluck(openPlaatsen, 'plaatsId')).toStrictEqual(['1', '2', '3']);
    });
});

describe('Een VPH die wil verplaatsen', () => {
    it('mag dit voor sollicitanten worden ingedeeld', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1 },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['1'] }
            ],
            marktplaatsen: [{}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2' },
                { sollicitatieNummer: 2, plaatsId: '2' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2']);
    });

    it('kan altijd verplaatsen naar een losse plaats', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }
            ],
            marktplaatsen: [{}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
    });

    it('mag niet naar een plaats van een andere aanwezige VPH', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] }
            ],
            marktplaatsen: [
                {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2']);
    });

    it('mag ruilen met een andere VPH', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { status: 'vpl', plaatsen: ['1'] },
                { status: 'vpl', plaatsen: ['2'] }
            ],
            marktplaatsen: [{}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2' },
                { sollicitatieNummer: 2, plaatsId: '1' }
            ]
        });

        expect(toewijzingen.length).toBe(2);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });

    it('kan de plaats van een andere VPH krijgen als die ook verplaatst', () => {
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] }
            ],
            marktplaatsen: [{}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);

        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] },
                { sollicitatieNummer: 3, status: 'vpl', plaatsen: ['3'] }
            ],
            marktplaatsen: [{}, {}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '4', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE },
                { sollicitatieNummer: 3, plaatsId: '1', priority: FIRST_CHOICE },
                { sollicitatieNummer: 3, plaatsId: '5', priority: SECOND_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2, 3]);

        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['4']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 3)).toStrictEqual(['5']);
    });

    it('blijft staan als een VPH met hogere anciënniteit dezelfde voorkeur heeft', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3'] },
                { sollicitatieNummer: 3, status: 'vpl', plaatsen: ['2'] }
            ],
            marktplaatsen: [{}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE },
                { sollicitatieNummer: 3, plaatsId: '1', priority: FIRST_CHOICE },
                { sollicitatieNummer: 3, plaatsId: '3', priority: SECOND_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2, 3]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);

        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
        expect(findPlaatsen(toewijzingen, 3)).toStrictEqual(['2']);
    });

    it('kan naar een locatie met minimaal 1 beschikbare voorkeur', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3'] }
            ],
            marktplaatsen: [{}, {}, {}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['4', '5']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3']);
    });

    it('met meerdere plaatsen behoudt dit aantal na verplaatsing', () => {
        // VPH met plaatsen 1,2 heeft voorkeur 3. Plaats 3 is vrij --> verplaatsing naar 2,3.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE }
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);

        // VPH met plaatsen 1,2 heeft voorkeur 4. Plaats 3 en 4 is vrij --> verplaatsing naar 3,4.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '4', priority: FIRST_CHOICE },
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4']);

        // VPH met plaatsen 1,2 heeft voorkeur 4. Plaats 3 is niet vrij vrij --> verplaatsing naar 4,5.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, { inactive: true }, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '4', priority: FIRST_CHOICE }
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['4', '5']);

        // VPH met plaatsen 1,2 heeft voorkeur 3. Plaats 3 is niet vrij --> blijft staan.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, { inactive: true }, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);

        // VPH met plaatsen 1,2 heeft voorkeur 3,4. Plaats 3 en 4 zijn vrij --> verplaatsing naar 3,4.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE }
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4']);

        // VPH met plaatsen 1,2 heeft voorkeur 3,4. Plaats 3 is niet vrij --> verplaatsing naar 4,5.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, { inactive: true }, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE }
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['4', '5']);

        // VPH met plaatsen 1,2 heeft voorkeur 3,4. Plaats 4 is niet vrij --> verplaatsing naar 2,3.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, {}, { inactive: true }, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE }
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);

        // VPH met plaatsen 1,2 heeft voorkeur 5 --> verplaatsing naar 4,5.
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                {}, {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '5', priority: FIRST_CHOICE },
            ]
        });
        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['4', '5']);
    });
});

describe('Een sollicitant die ingedeeld wil worden', () => {
    it('krijgt voorkeur als zij op de A-lijst staan', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1 },
                { sollicitatieNummer: 2 }
            ],
            marktplaatsen: [{}],
            aLijst: [{ sollicitatieNummer: 2 }]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });

    it('mag naar een plaats van een afwezige VPH', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, plaatsen: ['2'], status: 'vpl' },
                { sollicitatieNummer: 2 }
            ],
            aanwezigheid: [
                { sollicitatieNummer: 1, attending: false },
                { sollicitatieNummer: 2, attending: true }
            ],
            marktplaatsen: [{}, {}],
            voorkeuren: [
                { sollicitatieNummer: 2, plaatsId: '2' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2']);
    });

    it('kan kiezen niet te worden ingedeeld op willekeurige plaatsen', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { anywhere: false, maximum: 3 } },
                { sollicitatieNummer: 2, voorkeur: { anywhere: false } }
            ],
            marktplaatsen: [{}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '2' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([2]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);
    });
});

// TODO: Tests uitwerken.
describe('Een ondernemer met eigen materieel die ingedeeld wil worden', () => {
    it('krijgt voorkeur op sollicitanten zonder eigen materieel op plaatsen zonder kraam', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1 },
                { sollicitatieNummer: 2, voorkeur: { verkoopinrichting: ['eigen-materieel'] } }
            ],
            marktplaatsen: [
                { verkoopinrichting: ['eigen-materieel'] }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });
});

// TODO: Tests uitwerken.
describe('Een branche ondernemer die ingedeeld wil worden', () => {
    it('krijgt voorkeur op sollicitanten zonder branche op brancheplaatsen', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1 },
                { sollicitatieNummer: 2, voorkeur: { branches: ['branche-x'] } }
            ],
            marktplaatsen: [
                { branches: ['branche-x'] }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1']);
    });
});

describe('Een ondernemer die wil uitbreiden', () => {
    it('blijft binnen dezelfde marktkraamrij', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } }
            ],
            marktplaatsen: [{}, {}],
            rows: [['1'], ['2']]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
    });

    it('kan een 2de plaats krijgen', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } }
            ],
            marktplaatsen: [{}, {}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
    });

    it('naar meer dan 2 plaatsen moet wachten op iedereen die 2 plaatsen wil', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['2', '3'], voorkeur: { maximum: 3 } },
                { sollicitatieNummer: 2, voorkeur: { maximum: 2 } }
            ],
            marktplaatsen: [{}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '1', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '4', priority: SECOND_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3', '4']);
    });

    it('kan 3 plaatsen krijgen', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 3 } }
            ],
            marktplaatsen: [{}, {}, {}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2', '3']);
    });

    it('kan niet verder vergroten dan is toegestaan', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['3', '4'], voorkeur: { maximum: 4 } },
                { sollicitatieNummer: 2, voorkeur: { maximum: 3 } }
            ],
            marktplaatsen: [{}, {}, {}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '4', priority: SECOND_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '5', priority: THIRD_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '6', priority: THIRD_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '1', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '2', priority: SECOND_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '3', priority: THIRD_CHOICE }
            ],
            expansionLimit: 3
        });

        expect(toewijzingen.length).toBe(2);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4', '5']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['1', '2']);
    });

    it('kan dat niet naar een zijde met een obstakel', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } }
            ],
            marktplaatsen: [{}, {}],
            obstakels: [
                { kraamA: '1', kraamB: '2', obstakel: ['boom'] }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1']);
    });

    it('kan een minimum aantal gewenste plaatsen opgeven', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { minimum: 2 } }
            ],
            marktplaatsen: [{}, {}]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
    });

    it('kan een maximum aantal gewenste plaatsen opgeven', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } },
                { sollicitatieNummer: 2, status: 'vpl', plaatsen: ['3', '4'], voorkeur: { maximum: 3 } }
            ],
            marktplaatsen: [
                {}, {}, {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 2, plaatsId: '5' },
                { sollicitatieNummer: 2, plaatsId: '6' }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['4', '5', '6']);
    });

    it('wordt afgewezen als niet aan zijn minimum gewenste plaatsen wordt voldaan', () => {
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { status: 'vpl', plaatsen: ['1', '2'], voorkeur: { minimum: 2 } },
                { voorkeur: { minimum: 2 } }
            ],
            marktplaatsen: [
                {}, { inactive: true }, { inactive: true }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([1, 2]);

        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { voorkeur: { minimum: 3 } },
                { voorkeur: { minimum: 2 } }
            ],
            marktplaatsen: [
                {}, {}, {}
            ],
            expansionLimit: 2
        });

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(1);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['2', '3']);
    });

    it('kan dat niet indien het maximum aantal branche-plaatsen wordt overschreden', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 3, branches: ['branche-x'] } }
            ],
            marktplaatsen: [{}, {}, {}],
            branches: [{
                brancheId: 'branche-x',
                maximumPlaatsen: 2
            }]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
    });

    it('krijgt extra plaats(en) aan hun voorkeurszijde', () => {
        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['2', '3'], voorkeur: { maximum: 3 } }
            ],
            marktplaatsen: [{}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '1', priority: 2 },
                { sollicitatieNummer: 1, plaatsId: '4', priority: 1 }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2', '3']);

        var { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } },
                { sollicitatieNummer: 2, voorkeur: { maximum: 2 } }
            ],
            marktplaatsen: [
                {}, {}, {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '2', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '3', priority: SECOND_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '5', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '4', priority: SECOND_CHOICE }
            ]
        });

        expect(findOndernemers(toewijzingen)).toStrictEqual([1, 2]);
        expect(findOndernemers(afwijzingen)).toStrictEqual([]);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['2', '3']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['4', '5']);
    });

    it.skip('Een ondernemer kan kiezen NIET te verschuiven om het minimum aantal plaatsen te krijgen', () => {
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { minimum: 2, anywhere: true } }
            ],
            marktplaatsen: [
                {}, { inactive: true }, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '1' },
                { sollicitatieNummer: 1, plaatsId: '2' }
            ]
        });

        expect(toewijzingen.length).toBe(1);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['3', '4']);
    });

    it.skip('Een ondernemer kan kiezen te verschuiven om het minimum aantal plaatsen te krijgen', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { voorkeur: { minimum: 2 } },
                {}
            ],
            marktplaatsen: [{}, {}, {}, {}],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '1' },
                { sollicitatieNummer: 2, plaatsId: '2' }
            ]
        });

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
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { status: 'vpl', plaatsen: ['1', '2', '3'] }
            ],
            marktplaatsen: [
                {}, { inactive: true }, {}
            ]
        });

        // TODO: What should happen in this case?
    });

    it.skip('Een vasteplaatshouder wordt voor zover mogelijk toegewezen aan zijn vaste plaatsen', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         */
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { status: 'vpl', plaatsen: ['1', '2'] }
            ],
            marktplaatsen: [
                { inactive: true }, {}
            ]
        });

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
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1', '2'] },
                {}
            ],
            marktplaatsen: [{ inactive: true }, {}, {}]
        });

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
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, status: 'vpl', plaatsen: ['3', '4'] }
            ],
            marktplaatsen: [{}, {}, { inactive: true }, {}]
        });

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
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { voorkeur: { maximum: 3 } }
            ],
            marktplaatsen: [
                {}, {}, {}, {}
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '4', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '1', priority: SECOND_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '2', priority: THIRD_CHOICE }
            ],
            rows: [['1', '2', '3', '4', '1']]
        });

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
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } },
                { sollicitatieNummer: 2, voorkeur: { maximum: 2, branches: ['branche-x'] } }
            ],
            marktplaatsen: [
                {},
                {},
                { branches: ['branche-x'] },
                { branches: ['branche-x'] }
            ],
            voorkeuren: [
                { sollicitatieNummer: 1, plaatsId: '3', priority: FIRST_CHOICE },
                { sollicitatieNummer: 1, plaatsId: '2', priority: SECOND_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '4', priority: FIRST_CHOICE },
                { sollicitatieNummer: 2, plaatsId: '3', priority: SECOND_CHOICE }
            ]
        });

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
        const { toewijzingen, afwijzingen } = calc({
            ondernemers: [
                { sollicitatieNummer: 1, voorkeur: { maximum: 2 } },
                { sollicitatieNummer: 2, voorkeur: { maximum: 2 } }
            ],
            marktplaatsen: [
                {}, {}, {}, {}
            ],
            rows: [['1', '2'], ['3', '4']]
        });

        expect(toewijzingen.length).toBe(2);
        expect(afwijzingen.length).toBe(0);
        expect(findPlaatsen(toewijzingen, 1)).toStrictEqual(['1', '2']);
        expect(findPlaatsen(toewijzingen, 2)).toStrictEqual(['3', '4']);
    });
});

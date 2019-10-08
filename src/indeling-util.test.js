/* eslint-disable no-magic-numbers */

const Markt = require('./allocation/markt.ts').default;

const { calcToewijzingen } = require('./indeling.ts');
const { marktScenario }    = require('./indeling-scenario.ts');

describe('calcToewijzingen', () => {
    it('requires a valid marktDate', () => {
        const markt  = marktScenario({ marktDate: null });
        const markt2 = marktScenario({ marktDate: 'invalid' });
        const markt3 = marktScenario({ marktDate: '2019-01-01' });

        expect(calcToewijzingen.bind(null, markt)).toThrow();
        expect(calcToewijzingen.bind(null, markt2)).toThrow();
        expect(calcToewijzingen.bind(null, markt3)).not.toThrow();
    });
});

describe('Markt.getAdjacentPlaatsen', () => {
    const getAdjacent = (rows, placeIds, depth=1, obstakels, filter) => {
        const markt = marktScenario({ rows, obstakels });

        return Markt.getAdjacentPlaatsen(markt, placeIds, depth, filter)
        .map(({ plaatsId }) => plaatsId)
        .sort();
    };

    describe('Get adjacent for single place', () => {
        it('returns nothing for single place rows', () => {
            expect(getAdjacent([['1']], ['1'])).toStrictEqual([]);
            expect(getAdjacent([['1']], ['1'], 2)).toStrictEqual([]);
        });

        it('returns places from one side when needle is at the beginning/end', () => {
            // Needle at beginning...
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1'])).toStrictEqual(['2']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1'], 2)).toStrictEqual(['2', '3']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1'], 2, [], ({ plaatsId }) => plaatsId !== '3')).toStrictEqual(['2']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1'], 2, [], ({ plaatsId }) => plaatsId !== '2')).toStrictEqual([]);
            // ...and end.
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['6'])).toStrictEqual(['5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['6'], 2)).toStrictEqual(['4', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['6'], 2, [], ({ plaatsId }) => plaatsId !== '4')).toStrictEqual(['5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['6'], 2, [], ({ plaatsId }) => plaatsId !== '5')).toStrictEqual([]);
        });

        it('returns places from both sides when needle is not at beginning/end', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['2'])).toStrictEqual(['1', '3']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['2'], 2)).toStrictEqual(['1', '3', '4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['3'], 2)).toStrictEqual(['1', '2', '4', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['3'], 2, [], ({ plaatsId }) => plaatsId !== '2')).toStrictEqual(['4', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['3'], 2, [], ({ plaatsId }) => plaatsId !== '4')).toStrictEqual(['1', '2']);
        });

        it('does not return places from adjacent rows', () => {
            expect(getAdjacent([['3', '4', '5', '6'], ['23', '22']], ['6'])).toStrictEqual(['5']);
            expect(getAdjacent([['3', '4', '5', '6'], ['23', '22']], ['6'], 2)).toStrictEqual(['4', '5']);
            expect(getAdjacent([['3', '4', '5', '6'], ['23', '22']], ['6'], 5)).toStrictEqual(['3', '4', '5']);
        });
    });

    describe('Get adjacent for multiple places', () => {
        it('returns nothing when needle matches row', () => {
            expect(getAdjacent([['1', '2']], ['1', '2'])).toStrictEqual([]);
            expect(getAdjacent([['1', '2']], ['1', '2'], 2)).toStrictEqual([]);
            expect(getAdjacent([['1', '2']], ['1', '2'], 3)).toStrictEqual([]);
        });

        it('returns places from one side when needle is at the beginning/end', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1', '2'])).toStrictEqual(['3']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1', '2'], 2)).toStrictEqual(['3', '4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['1', '2'], 3)).toStrictEqual(['3', '4', '5']);

            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['5', '6'])).toStrictEqual(['4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['5', '6'], 2)).toStrictEqual(['3', '4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['5', '6'], 3)).toStrictEqual(['2', '3', '4']);
        });

        it('returns places from both sides when needle is not at beginning/end', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['2', '3'])).toStrictEqual(['1', '4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['2', '3'], 2)).toStrictEqual(['1', '4', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['3', '4'], 2)).toStrictEqual(['1', '2', '5', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '7', '8']], ['3', '4'], 3)).toStrictEqual(['1', '2', '5', '6', '7']);
        });
    });

    describe('Get adjacent for circular rows', () => {
        it('returns nothing when needle covers all places in a row', () => {
            expect(getAdjacent([['1', '2', '1']], ['1', '2'])).toStrictEqual([]);
            expect(getAdjacent([['1', '2', '3', '4', '5', '1']], ['1', '2', '3', '4', '5'])).toStrictEqual([]);
        });

        it('goes around when single-place needle is at beginning/end', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1'])).toStrictEqual(['2', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1'], 2)).toStrictEqual(['2', '3', '5', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['2'], 2)).toStrictEqual(['1', '3', '4', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1'], 3)).toStrictEqual(['2', '3', '4', '5', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['6'])).toStrictEqual(['1', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['6'], 2)).toStrictEqual(['1', '2', '4', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['6'], 3)).toStrictEqual(['1', '2', '3', '4', '5']);
        });

        it('goes around when multi-place needle is at beginning/end', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1', '2'])).toStrictEqual(['3', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1', '2'], 2)).toStrictEqual(['3', '4', '5', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1', '2'], 3)).toStrictEqual(['3', '4', '5', '6']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['5', '6'])).toStrictEqual(['1', '4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['5', '6'], 2)).toStrictEqual(['1', '2', '3', '4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['5', '6'], 3)).toStrictEqual(['1', '2', '3', '4']);
        });

        it('stops looking when depth is infinite', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['6'], Infinity)).toStrictEqual(['1', '2', '3', '4', '5']);
        });
    });

    describe('Get adjacent with obstacles', () => {
        const obstacles = [{
            kraamA   : '2',
            kraamB   : '3',
            obstakel : ['bergketen']
        }, {
            kraamA   : '6',
            kraamB   : '1',
            obstakel : ['waterzuivering']
        }];

        it('stops expanding at an obstacle in a linear row', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['2'], 1, obstacles)).toStrictEqual(['1']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['2'], 2, obstacles)).toStrictEqual(['1']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['3'], 1, obstacles)).toStrictEqual(['4']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['3'], 2, obstacles)).toStrictEqual(['4', '5']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6']], ['4'], 2, obstacles)).toStrictEqual(['3', '5', '6']);
        });

        it('stops expanding at an obstacle in a circular row', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['2'], 1, obstacles)).toStrictEqual(['1']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['2'], 2, obstacles)).toStrictEqual(['1']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['1'], 2, obstacles)).toStrictEqual(['2']);
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], ['4'], 3, obstacles)).toStrictEqual(['3', '5', '6']);
        });
    });
});

describe('Markt.groupByAdjacent', () => {
    const groupByAdjacent = (rows, placeIds, obstakels) => {
        const markt    = marktScenario({ rows, obstakels });
        const plaatsen = placeIds.map(plaatsId => ({ plaatsId }));

        return Markt.groupByAdjacent(markt, plaatsen)
        .map(group => group.map(({ plaatsId }) => plaatsId));
    };

    it('works', () => {
        expect(groupByAdjacent(
            [
                ['1', '2', '3', '4', '5', '6'],
                ['7', '8', '9', '10'],
                ['11', '12', '13', '14', '15', '16', '17'],
                ['18', '19', '20', '18']
            ],
            ['1', '2', '7', '12', '13', '14', '16', '17', '20', '18'],
            [{
                kraamA   : '16',
                kraamB   : '17',
                obstakel : ['raketlanceerinstallatie']
            }]
        )).toStrictEqual(
            [['1', '2'], ['7'], ['12', '13', '14'], ['16'], ['17'], ['20', '18']]
        );
    });
});


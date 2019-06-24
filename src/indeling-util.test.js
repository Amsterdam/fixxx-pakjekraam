const { getAdjacentPlaatsen, getAdjacentPlaatsenRecursive } = require('./indeling.ts');

describe('Aanliggende plaatsen', () => {
    const toMarktplaatsen = rows => {
        const map = {};

        return rows.map(ids => ids.map(plaatsId => map[plaatsId] || (map[plaatsId] = { plaatsId })));
    };

    const getPlaats = (rows, id) => rows.find(({ plaatsId }) => plaatsId === id);

    describe('getAdjacentPlaatsen', () => {
        const getAdjacent = (ids, id) => {
            const rows = toMarktplaatsen(ids);

            return getAdjacentPlaatsen(rows, id)
                .map(({ plaatsId }) => plaatsId)
                .sort();
        };

        it('getAdjacentPlaatsen', () => {
            expect(getAdjacent([['1']], '1')).toStrictEqual([]);
        });

        it('getAdjacentPlaatsen', () => {
            expect(getAdjacent([['1', '2']], '1')).toStrictEqual(['2']);
        });
    });

    describe('getAdjacentPlaatsenRecursive', () => {
        const getAdjacent = (ids, id, n) => {
            const rows = toMarktplaatsen(ids);

            return getAdjacentPlaatsenRecursive(rows, id, n).sort();
        };

        it('getAdjacentPlaatsenRecursive', () => {
            expect(getAdjacent([['1']], '1')).toStrictEqual([]);
        });

        it('getAdjacentPlaatsenRecursive', () => {
            expect(getAdjacent([['1', '2']], '1')).toStrictEqual(['2']);
        });

        it('getAdjacentPlaatsenRecursive', () => {
            expect(getAdjacent([['1', '2', '3']], '1', 2).sort()).toStrictEqual(['2', '3']);
        });

        it('getAdjacentPlaatsenRecursive', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], '6', 2).sort()).toStrictEqual([
                '1',
                '2',
                '4',
                '5',
            ]);
        });

        // TODO
        it.skip('getAdjacentPlaatsenRecursive', () => {
            expect(getAdjacent([['1', '2', '3', '4', '5', '6', '1']], '6', Infinity).sort()).toStrictEqual([
                '1',
                '2',
                '3',
                '4',
                '5',
            ]);
        });
    });
});

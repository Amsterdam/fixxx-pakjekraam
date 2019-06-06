const { plaatsSort } = require('./domain-knowledge.js');

describe('Sorteren marktkraamplaatsen', () => {
    it('Marktplaatsen moeten in logische volgorde staan', () => {
        const plaatsen = ['B1', '1', '11', '2', '3', 'A1', 'B11', 'B2', 'A2'];
        expect(plaatsen.sort(plaatsSort)).toStrictEqual(['1', '2', '3', '11', 'A1', 'A2', 'B1', 'B2', 'B11']);
    });
});

const { calcToewijzingen } = require('./indeling.ts');
const { marktScenario } = require('./indeling-scenario.ts');

/* eslint-disable no-magic-numbers */

describe('Automatisch toewijzen marktplaatsen', () => {
    it('Een ondernemer wordt toegewezen aan een lege plek', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer()],
            marktplaatsen: [marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(0);
    });

    it('Een vasteplaatshouder wordt toegewezen aan de vaste plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['2'] })],
            marktplaatsen: [marktplaats(), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen).toStrictEqual(['2']);
    });

    it('Een vasteplaatshouder wordt toegewezen aan de vaste plaatsen', () => {
        /*
         * Scenario:
         * - 4 marktplaatsen
         * - 1 ondernemer met een meervoudige plaats
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['2', '3', '4'] })],
            marktplaatsen: [marktplaats(), marktplaats(), marktplaats(), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen.sort()).toStrictEqual(['2', '3', '4']);
    });

    it('Een ondernemer kan uitbreiden naar een tweede plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met een dubbele plaats
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ voorkeur: { aantalPlaatsen: 2 } })],
            marktplaatsen: [marktplaats(), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen.sort()).toStrictEqual(['1', '2']);
    });

    it.skip('Een ondernemer kan uitbreiden naar een meervoudige plaats', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een meervoudige plaats
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ voorkeur: { aantalPlaatsen: 3 } })],
            marktplaatsen: [marktplaats(), marktplaats(), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen.sort()).toStrictEqual(['1', '2', '3']);
    });

    it('Een ondernemer met te laag ancenniteitsnummer krijgt geen dagvergunning op een volle markt', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 2 ondernemers
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 99 }), ondernemer({ sollicitatieNummer: 42 })],
            marktplaatsen: [marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 42)).toBe(true);
        expect(indeling.afwijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
    });

    it('Een ondernemer met vaste plaats krijgt voorkeur', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer met hoge anceniteit zonder vaste plaats
         * - 1 ondernemer met lagere anceniteit en vaste plaats
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, status: 'soll' }),
                ondernemer({ sollicitatieNummer: 99, status: 'vpl' }),
            ],
            marktplaatsen: [marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
    });

    it('Een ondernemer met tijdelijke vaste plaats krijgt voorkeur', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer met hoge anceniteit zonder vaste plaats
         * - 1 ondernemer met lagere anceniteit en tijdelijke vaste plaats
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, status: 'soll' }),
                ondernemer({ sollicitatieNummer: 99, status: 'vkk' }),
            ],
            marktplaatsen: [marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
    });

    it.skip('Een ondernemer met toegewezen (tijdelijke) vaste plaats heeft altijd recht op de toegewezen plaats', () => {
        /*
         * Scenario:
         * - 5 marktplaatsen
         * - 2 ondernemer met lage anceniteit maar met vaste plaatsen
         * - 3 ondernemers met hoge anceniteit die ook graag op de vaste plaatsen willen staan
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, status: 'vpl' }),
                ondernemer({ sollicitatieNummer: 43, status: 'vkk' }),
                ondernemer({ sollicitatieNummer: 44, status: 'soll' }),
                ondernemer({ sollicitatieNummer: 98, status: 'vkk', plaatsen: ['2'] }),
                ondernemer({ sollicitatieNummer: 99, status: 'vpl', plaatsen: ['1'] }),
            ],
            marktplaatsen: [marktplaats(), marktplaats(), marktplaats(), marktplaats(), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(5);
        expect(indeling.afwijzingen.length).toBe(0);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 98).plaatsen,
        ).toStrictEqual(['2']);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99).plaatsen,
        ).toStrictEqual(['1']);
    });

    it('Een ondernemer met een branche krijgt voorkeur', () => {
        /*
         * Scenario:
         * - 1 marktplaats met branche
         * - 1 ondernemer met hoge anceniteit zonder branche
         * - 1 ondernemer met lage anceniteit en branchetoewijzing
         */

        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42 }),
                ondernemer({ sollicitatieNummer: 99, branches: ['branche-x'] }),
            ],
            marktplaatsen: [marktplaats({ branches: ['branche-x'] })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
    });

    it('Een ondernemer met eigen materieel krijgt voorkeur', () => {
        /*
         * Scenario:
         * - 1 marktplaats met eigen materieel voorkeur
         * - 1 ondernemer met hoge anceniteit zonder eigen materieel
         * - 1 ondernemer met lage anceniteit met eigen materieel
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42 }),
                ondernemer({ sollicitatieNummer: 99, verkoopinrichting: ['eigen-materieel'] }),
            ],
            marktplaatsen: [marktplaats({ verkoopinrichting: ['eigen-materieel'] })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
    });

    it('Een ondernemer op de A-lijst krijgt voorkeur', () => {
        /*
         * Scenario:
         * - 1 marktplaats
         * - 1 ondernemer op de A-lijst met lage anceniteit
         * - 1 ondernemer niet op de A-lijst met hoge anceniteit
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ sollicitatieNummer: 42 }), ondernemer({ sollicitatieNummer: 99 })],
            marktplaatsen: [marktplaats()],
            aLijst: [ondernemer({ sollicitatieNummer: 99 })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
        expect(indeling.afwijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 42)).toBe(true);
    });

    it('Een (tijdelijk) inactieve marktplaats wordt niet ingedeeld', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 2 ondernemers
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1'] }), ondernemer()],
            marktplaatsen: [marktplaats({ inactive: true })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(0);
        expect(indeling.afwijzingen.length).toBe(2);
    });

    it('Een ondernemer die maximalisatie van een branche overschrijdt krijgt geen dagvergunning', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers met dezelfde branchetoewijzing
         * - de markt staat maximaal 1 ondernemer toe met deze branchetoewijzing
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 99, branches: ['branche-x'] }),
                ondernemer({ sollicitatieNummer: 42, branches: ['branche-x'] }),
            ],
            marktplaatsen: [marktplaats(), marktplaats()],
            branches: [
                {
                    brancheId: 'branche-x',
                    maximum: 1,
                },
            ],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(1);
        expect(indeling.toewijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 42)).toBe(true);
        expect(indeling.afwijzingen.some(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)).toBe(true);
    });

    it.skip(
        'Een ondernemer kan niet uitbreiden naar een andere marktkraamrij',
        test.todo,
        /*
         * Scenario:
         * - 2 marktplaatsen gescheiden door een straat
         * - 1 ondernemer met een voorkeur voor 2 kramen
         */
    );

    it.skip(
        'Een ondernemer die kan uitbreiden aan verschillende zijden, wordt ingedeeld bij de voorkeurszijde',
        test.todo,
        /*
         * Scenario:
         * - 3 marktplaatsen
         * - 1 ondernemer met een vaste plek op de 2e kraam
         * - de ondernemer heeft een voorkeur voor kraam 2, daarna 1, daarna 3
         */
    );
});

describe('Automatisch toewijzen marktplaatsen: verschuiven', () => {
    it('Een ondernemer met vaste plaats kan kiezen voor een andere plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met vaste plaats is toegekend aan de eerste plaats
         *   en heeft een voorkeur geuit om op tweede plaats te staan
         */
        const markt = marktScenario(({ ondernemer, marktplaats, voorkeur }) => ({
            ondernemers: [ondernemer({ status: 'vpl', sollicitatieNummer: 42, plaatsen: ['1'] })],
            marktplaatsen: [marktplaats(), marktplaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 42, plaatsId: '2' })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(0);
        expect(
            indeling.toewijzingen
                .filter(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 42)
                .map(toewijzing => toewijzing.plaatsen)[0],
        ).toStrictEqual(['2']);
    });

    it('Een ondernemer met vaste plaats kan kiezen voor de plaats van een andere vasteplaatshouder die afwezig is', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 1 ondernemer met vaste plaats is toegekend aan de eerste plaats
         *   en heeft een voorkeur geuit om op tweede plaats te staan
         */

        const markt = marktScenario(({ ondernemer, marktplaats, aanmelding, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 42, plaatsen: ['2'], status: 'vpl' }),
                ondernemer({ sollicitatieNummer: 99 }),
            ],
            aanwezigheid: [
                aanmelding({ sollicitatieNummer: 42, attending: false }),
                aanmelding({ sollicitatieNummer: 99, attending: true }),
            ],
            marktplaatsen: [marktplaats(), marktplaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 99, plaatsId: '2' })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.afwijzingen.length).toBe(0);
        expect(
            indeling.toewijzingen
                .filter(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 99)
                .map(toewijzing => toewijzing.plaatsen)[0],
        ).toStrictEqual(['2']);
    });

    it.skip('Een vasteplaatshouder kan van plaats ruilen met een andere vasteplaatshouder', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const markt = marktScenario(({ ondernemer, marktplaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ status: 'vpl', plaatsen: ['2'] }),
            ],
            marktplaatsen: [marktplaats(), marktplaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 1, plaatsId: '2' }, { sollicitatieNummer: 2, plaatsId: '1' })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(2);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 1).plaatsen,
        ).toStrictEqual(['2']);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 2).plaatsen,
        ).toStrictEqual(['1']);
    });

    it.skip('Een vasteplaatshouder kan wordt niet geplaatst op een van plaats van een andere vasteplaatshouder', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const markt = marktScenario(({ ondernemer, marktplaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] }),
            ],
            marktplaatsen: [marktplaats(), marktplaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 1, plaatsId: '2' })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(2);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 1).plaatsen,
        ).toStrictEqual(['1']);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 2).plaatsen,
        ).toStrictEqual(['2']);
    });

    it.skip('Een vasteplaatshouder kan verplaatsen naar een losse plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const markt = marktScenario(({ ondernemer, marktplaats, voorkeur }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1'] })],
            marktplaatsen: [marktplaats(), marktplaats()],
            voorkeuren: [voorkeur({ sollicitatieNummer: 1, plaatsId: '2' })],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 1).plaatsen,
        ).toStrictEqual(['2']);
    });

    it.skip('Een vasteplaatshouder kan verplaatsen naar een van plaats van een andere vasteplaatshouder die verplaatst naar een losse plaats', () => {
        /*
         * Scenario:
         * - 2 marktplaatsen
         * - 2 ondernemers
         */
        const markt = marktScenario(({ ondernemer, marktplaats, voorkeur }) => ({
            ondernemers: [
                ondernemer({ sollicitatieNummer: 1, status: 'vpl', plaatsen: ['1'] }),
                ondernemer({ sollicitatieNummer: 2, status: 'vpl', plaatsen: ['2'] }),
            ],
            marktplaatsen: [marktplaats(), marktplaats(), marktplaats()],
            voorkeuren: [
                voorkeur({ sollicitatieNummer: 1, plaatsId: '2' }),
                voorkeur({ sollicitatieNummer: 2, plaatsId: '3' }),
            ],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(2);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 1).plaatsen,
        ).toStrictEqual(['2']);
        expect(
            indeling.toewijzingen.find(toewijzing => toewijzing.ondernemer.sollicitatieNummer === 2).plaatsen,
        ).toStrictEqual(['3']);
    });
});

describe('Automatisch toewijzen marktplaatsen: edge cases', () => {
    it.skip('Een vasteplaatshouder niet toegewezen kan worden aan één van de vaste plaatsen', () => {
        /*
         * Scenario:
         * - 3 marktplaatsen, waarvan de middelste tijdelijk buiten gebruik is
         * - 1 ondernemer met een meervoudige plaats, die niet op zijn vaste plaats kan
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1', '2', '3'] })],
            marktplaatsen: [marktplaats(), marktplaats({ inactive: true }), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        // TODO: What should happen in this case?
    });

    it.skip('Een vasteplaatshouder wordt voor zover mogelijk toegewezen aan de vaste plaatsen', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1', '2'] })],
            marktplaatsen: [marktplaats({ inactive: true }), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen).toStrictEqual(['2']);

        /*
         * TODO: Decide if there should be afwijzing too?
         * expect(indeling.afwijzingen.length).toBe(1);
         */
    });

    it.skip('Een wordt gecompenseerd voor een (tijdelijk) inactieve vaste plaats', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         * - 1 sollicitant
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['1', '2'] }), ondernemer()],
            marktplaatsen: [marktplaats({ inactive: true }), marktplaats(), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen).toStrictEqual(['2', '3']);

        // TODO: Should we expect a (partial) reject for the vasteplaatshouder?
        expect(indeling.afwijzingen.length).toBe(1);
    });

    it.skip('Een vasteplaatshouder krijgt bij verplaatsing het vaste aantal plaatsen', () => {
        /*
         * Scenario:
         * - 1 inactieve marktplaats
         * - 1 actieve marktplaats
         * - 1 ondernemer die deze als vaste plaatsen heeft
         */
        const markt = marktScenario(({ ondernemer, marktplaats }) => ({
            ondernemers: [ondernemer({ status: 'vpl', plaatsen: ['3', '4'] })],
            marktplaatsen: [marktplaats(), marktplaats(), marktplaats({ inactive: true }), marktplaats()],
        }));

        const indeling = calcToewijzingen(markt);

        expect(indeling.toewijzingen.length).toBe(1);
        expect(indeling.toewijzingen[0].plaatsen).toStrictEqual(['1', '2']);

        /*
         * TODO: Decide if there should be afwijzing too?
         * expect(indeling.afwijzingen.length).toBe(1);
         */
    });
});

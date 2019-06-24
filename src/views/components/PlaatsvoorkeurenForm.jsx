const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName } = require('../../domain-knowledge.js');
const { flatten } = require('../../util.js');
const MarktplaatsSelect = require('./MarktplaatsSelect');
const Button = require('./Button');

class PlaatsvoorkeurenForm extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        markten: PropTypes.array.isRequired,
        ondernemer: PropTypes.object.isRequired,
        query: PropTypes.string,
    };

    render() {
        const { markten, ondernemer, plaatsvoorkeuren, query } = this.props;
        let next = query.next ? query.next : `/voorkeuren/${ondernemer.erkenningsnummer}/`;
        next += '&error=plaatsvoorkeuren-saved';

        const hasVoorkeur = (marktId, plaatsId) =>
            plaatsvoorkeuren.some(voorkeur => voorkeur.marktId === marktId && voorkeur.plaatsId === plaatsId) ||
            ondernemer.sollicitaties.some(
                sollicitatie =>
                    sollicitatie.markt.id === parseInt(marktId, 10) && sollicitatie.vastePlaatsen.includes(plaatsId),
            );

        // fixme: vastePlaatsen related new item count
        const marktEntries = ondernemer.sollicitaties
            .map(sollicitatie => {
                return (sollicitatie.status === 'vpl' ? sollicitatie.vastePlaatsen : [1]).map(() => ({
                    marktId: sollicitatie.markt.id,
                    plaatsId: null,
                    erkenningsNummer: ondernemer.erkenningsnummer,
                    priority: 2,
                    readonly: false,
                    newItem: true,
                }));
            })
            .reduce(flatten, []);
        const voorkeurEntries = plaatsvoorkeuren.map((voorkeur, index) => {
            return {
                marktId: voorkeur.marktId,
                erkenningsNummer: voorkeur.erkenningsNummer,
                plaatsId: voorkeur.plaatsId,
                priority: voorkeur.priority + 1,
                readonly: false,
                newItem: false,
            };
        });

        const vastePlaatsEntries = ondernemer.sollicitaties
            .map(sollicitatie =>
                sollicitatie.vastePlaatsen.map(plaatsId => ({
                    marktId: sollicitatie.markt.id,
                    plaatsId,
                    erkenningsNummer: ondernemer.erkenningsnummer,
                    priority: 1,
                    readonly: true,
                })),
            )
            .reduce(flatten, []);

        const allEntries = [...marktEntries, ...voorkeurEntries].map((entry, index) => ({
            ...entry,
            index,
        }));

        return (
            <form
                className="Form Form--PlaatsvoorkeurenForm"
                method="POST"
                action="/voorkeuren/"
                encType="application/x-www-form-urlencoded"
                data-decorator="voorkeur-form"
            >
                <h1>Voorkeuren voor {formatOndernemerName(ondernemer)}</h1>
                <p>
                    Erkenningsnummer: <strong>{ondernemer.erkenningsnummer}</strong>
                    <input
                        id="erkenningsNummer"
                        type="hidden"
                        name="erkenningsNummer"
                        defaultValue={ondernemer.erkenningsnummer}
                    />
                </p>
                {markten.map(markt => {
                    const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id);
                    const entriesFiltered = allEntries.filter(entry => entry.marktId === markt.id);
                    // fixme: vastePlaatsen related new item count
                    const entriesSplit = entriesFiltered
                        .map((entry, i) => {
                            const newCount = sollicitatie.status === 'vpl' ? sollicitatie.vastePlaatsen.length : 1;

                            return i % newCount === 0
                                ? entriesFiltered.filter((e, j) => j >= i && j < i + newCount)
                                : null;
                        })
                        .filter(entry => !!entry);

                    return (
                        <div key={markt.id} className="PlaatsvoorkeurenForm__markt" data-markt-id={markt.id}>
                            <h2>{markt.naam}</h2>
                            {sollicitatie.status === 'vpl' ? (
                                <div className="well well--dark">
                                    Je vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null}:{' '}
                                    <strong>{sollicitatie.vastePlaatsen.join(' & ')}</strong>
                                </div>
                            ) : null}
                            <div className="PlaatsvoorkeurenForm__list">
                                {entriesSplit.map((entries, i, entriesArray) => (
                                    <div
                                        className={`PlaatsvoorkeurenForm__list-item well ${
                                            entries[0].priority !== 1 && entries[0].priority !== 2
                                                ? 'PlaatsvoorkeurenForm__list-item--sortable'
                                                : null
                                        } ${entries[0].readonly ? 'PlaatsvoorkeurenForm__list-item--hidden' : null}
                                        ${
                                            entries[0].priority !== 2
                                                ? 'PlaatsvoorkeurenForm__list-item--readonly'
                                                : null
                                        }`}
                                        key={i}
                                        style={{ ...{ order: entries[0].priority } }}
                                    >
                                        <h5 className="PlaatsvoorkeurenForm__list-item__heading">
                                            {entriesArray.length - i}e keuze
                                        </h5>
                                        {entries
                                            .filter(entry => entry.marktId === markt.id)
                                            .sort((a, b) => b.priority - a.priority)
                                            .map(
                                                ({ marktId, plaatsId, priority, index, readonly, newItem }, n, arr) => (
                                                    <div
                                                        key={index}
                                                        className={`PlaatsvoorkeurenForm__list-item__wrapper`}
                                                    >
                                                        <label
                                                            className="PlaatsvoorkeurenForm__list-item__label"
                                                            htmlFor={`voorkeur-${index}`}
                                                            style={{ display: 'none' }}
                                                        >
                                                            Voorkeursplaats {n + 1}:
                                                        </label>
                                                        <input
                                                            type="hidden"
                                                            name={`plaatsvoorkeuren[${index}][marktId]`}
                                                            defaultValue={markt.id}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name={`plaatsvoorkeuren[${index}][priority]`}
                                                            defaultValue={priority || arr.length - n}
                                                        />
                                                        <MarktplaatsSelect
                                                            name={`plaatsvoorkeuren[${index}][plaatsId]`}
                                                            id={`voorkeur-${index}`}
                                                            markt={markt}
                                                            value={plaatsId}
                                                            readonly={newItem ? true : readonly}
                                                            optional={true}
                                                            newItem={newItem}
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        {entries[0].priority !== 1 && entries[0].priority !== 2 ? (
                                            <div>
                                                <a href="#" data-handler="remove-voorkeur">
                                                    verwijder
                                                </a>
                                                {/* <br/>*/}
                                                {/* <a*/}
                                                {/* href="#"*/}
                                                {/* data-handler="move-voorkeur"*/}
                                                {/* data-direction="up"*/}
                                                {/* >*/}
                                                {/* naar boven*/}
                                                {/* </a>*/}
                                                {/* <br/>*/}
                                                {/* <a*/}
                                                {/* href="#"*/}
                                                {/* data-handler="move-voorkeur"*/}
                                                {/* data-direction="down"*/}
                                                {/* >*/}
                                                {/* naar beneden*/}
                                                {/* </a>*/}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                            <p className="InputField InputField--submit">
                                <button
                                    className="Button Button--secondary"
                                    type="submit"
                                    name="redirectTo"
                                    value={`/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=${next}`}
                                >
                                    Opslaan
                                </button>
                                <Button label="terug" href={next} type="tertiary" />
                            </p>
                        </div>
                    );
                })}
            </form>
        );
    }
}

module.exports = PlaatsvoorkeurenForm;

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
        const next = query.next ? query.next : `/voorkeuren/${ondernemer.erkenningsnummer}/`;
        const hasVoorkeur = (marktId, plaatsId) =>
            plaatsvoorkeuren.some(voorkeur => voorkeur.marktId === marktId && voorkeur.plaatsId === plaatsId) ||
            ondernemer.sollicitaties.some(
                sollicitatie =>
                    sollicitatie.markt.id === parseInt(marktId, 10) && sollicitatie.vastePlaatsen.includes(plaatsId),
            );

        /*
         * fixme: vastePlaatsen related new item count
         * const marktEntries = ondernemer.sollicitaties
         *     .map(sollicitatie =>
         *         sollicitatie.vastePlaatsen.map(plaatsId => ({
         *             marktId: sollicitatie.markt.id,
         *             plaatsId: null,
         *             erkenningsNummer: ondernemer.erkenningsnummer,
         *         })),
         *     )
         *     .reduce(flatten, []);
         */

        const marktEntries = markten
            .map(markt => {
                return [
                    {
                        marktId: markt.id,
                        plaatsId: null,
                        erkenningsNummer: ondernemer.erkenningsnummer,
                        priority: 2,
                    },
                ];
            })
            .reduce(flatten, []);

        const voorkeurEntries = plaatsvoorkeuren.map((voorkeur, index) => {
            return {
                marktId: voorkeur.marktId,
                erkenningsNummer: voorkeur.erkenningsNummer,
                plaatsId: voorkeur.plaatsId,
                priority: voorkeur.priority + 1,
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

        const entries = [...marktEntries, ...voorkeurEntries, ...vastePlaatsEntries].map((entry, index) => ({
            ...entry,
            index,
        }));

        return (
            <form
                className="Form Form--PlaatsvoorkeurenForm"
                method="POST"
                action="/voorkeuren/"
                encType="application/x-www-form-urlencoded"
            >
                <h1>Voorkeuren voor {formatOndernemerName(ondernemer)}</h1>
                {/* <input type="hidden" name="redirectTo" defaultValue={next} />*/}
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
                    const entriesFiltered = entries.filter(entry => entry.marktId === markt.id);

                    // fixme: vastePlaatsen related new item count
                    const entriesSplit = entriesFiltered.map((entry, i) => {
                        return i % sollicitatie.vastePlaatsen.length === 0
                            ? entriesFiltered.filter((e, j) => j >= i && j < i + sollicitatie.vastePlaatsen.length)
                            : null;
                    });

                    return (
                        <div key={markt.id} className="PlaatsvoorkeurenForm__markt">
                            <h2>{markt.naam}</h2>
                            <div className="PlaatsvoorkeurenForm__list">
                                {entries
                                    .filter(entry => entry.marktId === markt.id)
                                    .sort((a, b) => b.priority - a.priority)
                                    .map(({ marktId, plaatsId, priority, index, readonly }, n, arr) => (
                                        <div
                                            key={index}
                                            className={`PlaatsvoorkeurenForm__list-item ${
                                                readonly ? 'PlaatsvoorkeurenForm__list-item--readonly' : null
                                            } well`}
                                            style={{ ...{ order: priority || arr.length - n } }}
                                        >
                                            <label
                                                className="PlaatsvoorkeurenForm__list-item__label"
                                                htmlFor={`voorkeur-${index}`}
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
                                                readonly={readonly}
                                                optional={true}
                                            />
                                            {priority !== 1 && priority !== 2 ? (
                                                <a href="#" data-handler="remove-voorkeur">
                                                    verwijder
                                                </a>
                                            ) : null}
                                        </div>
                                    ))}
                            </div>
                            <p className="InputField InputField--submit">
                                <button
                                    className="Button Button--primary"
                                    type="submit"
                                    name="redirectTo"
                                    value={`/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=${next}`}
                                >
                                    Opslaan
                                </button>
                                <button
                                    className="Button Button--secondary"
                                    type="submit"
                                    name="redirectTo"
                                    value={next}
                                >
                                    Opslaan en terug
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

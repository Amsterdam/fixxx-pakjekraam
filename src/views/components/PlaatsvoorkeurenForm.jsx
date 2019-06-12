const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName, plaatsSort } = require('../../domain-knowledge.js');
const { stringSort, flatten } = require('../../util.js');
const MarktplaatsSelect = require('./MarktplaatsSelect');

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
        const marktEntries = markten
            .map(markt => {
                return [
                    {
                        marktId: markt.id,
                        plaatsId: null,
                        erkenningsNummer: ondernemer.erkenningsnummer,
                    },
                    {
                        marktId: markt.id,
                        plaatsId: null,
                        erkenningsNummer: ondernemer.erkenningsnummer,
                    },
                ];
            })
            .reduce(flatten, []);

        const voorkeurEntries = plaatsvoorkeuren.map((voorkeur, index) => {
            return {
                marktId: voorkeur.marktId,
                erkenningsNummer: voorkeur.erkenningsNummer,
                plaatsId: voorkeur.plaatsId,
                priority: voorkeur.priority,
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
            <form className="Form" method="POST" action="/voorkeuren/" encType="application/x-www-form-urlencoded">
                <h1>Voorkeuren voor {formatOndernemerName(ondernemer)}</h1>
                <input type="hidden" name="redirectTo" defaultValue={next} />
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
                    let entriesFiltered = entries.filter(entry => entry.marktId === markt.id);
                    console.log(entriesFiltered);
                    return (
                        <div key={markt.id}>
                            <h2>{markt.naam}</h2>
                            {entriesFiltered.map(({ marktId, plaatsId, priority, index, readonly }, n, arr) => (
                                <div className="InputField InputField--select" key={index}>
                                    <label htmlFor={`voorkeur-${index}`}>Voorkeursplaats {n + 1}:</label>
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][marktId]`}
                                        defaultValue={markt.id}
                                    />
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][priority]`}
                                        defaultValue={priority || 1 + (arr.length - n)}
                                    />
                                    <MarktplaatsSelect
                                        name={`plaatsvoorkeuren[${index}][plaatsId]`}
                                        id={`voorkeur-${index}`}
                                        markt={markt}
                                        value={plaatsId}
                                        readonly={readonly}
                                        optional={true}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}
                <p className="InputField InputField--submit">
                    <button className="Button Button--secondary" type="submit" name="next" value="/voorkeuren/">
                        Opslaan
                    </button>
                </p>
            </form>
        );
    }
}
module.exports = PlaatsvoorkeurenForm;

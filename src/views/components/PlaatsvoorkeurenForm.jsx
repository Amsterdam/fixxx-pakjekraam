const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName, plaatsSort, isVast } = require('../../domain-knowledge.js');
const { flatten } = require('../../util.js');
const MarktplaatsSelect = require('./MarktplaatsSelect');
const Button = require('./Button');
const OndernemerMarktHeading = require('./OndernemerMarktHeading');

class PlaatsvoorkeurenForm extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        markt: PropTypes.object.isRequired,
        ondernemer: PropTypes.object.isRequired,
        rows: PropTypes.array.isRequired,
        query: PropTypes.string,
    };

    render() {
        const { markt, ondernemer, plaatsvoorkeuren, query, rows } = this.props;

        const hasVoorkeur = (marktId, plaatsId) =>
            plaatsvoorkeuren.some(voorkeur => voorkeur.marktId === marktId && voorkeur.plaatsId === plaatsId) ||
            ondernemer.sollicitaties.some(
                sollicitatie =>
                    sollicitatie.markt.id === parseInt(marktId, 10) && sollicitatie.vastePlaatsen.includes(plaatsId),
            );
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

        const allEntries = [...voorkeurEntries].map((entry, index) => ({
            ...entry,
            index,
        }));

        const next = query.next ? query.next : `/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/`;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
        const newPlaatsvoorkeurCount = sollicitatie.vastePlaatsen.length > 0 ? sollicitatie.vastePlaatsen.length : 1;
        const entriesFiltered = allEntries.filter(entry => entry.marktId === markt.id);
        const entriesSplit = entriesFiltered
            .sort((a, b) => b.priority - a.priority)
            .reduce((t, e) => {
                !t.includes(e.priority) && t.push(e.priority);

                return t;
            }, [])
            .reduce((t, p) => {
                t.push(entriesFiltered.filter(e => e.priority === p));

                return t;
            }, []);

        const plaatsSets = entriesSplit.map(entry => entry.map(e => e.plaatsId));

        const rowsFlat = rows
            .reduce((t, r) => {
                r.map(p => t.push(p)), [];

                return t;
            })
            .sort((a, b) => plaatsSort(a, b, 'plaatsId'))
            .map(plaats => {
                plaats.disabled = !plaatsSets.reduce((t, set) => t.concat(set), []).includes(plaats.plaatsId);

                return plaats;
            });
        const marktRowsJSOM = () => {
            return { __html: 'var marktRows = ' + JSON.stringify(rows) + ';' };
        };
        const plaatsSetsJSON = () => {
            return { __html: 'var plaatsenSets = ' + JSON.stringify(plaatsSets) + ';' };
        };
        const marktRowsFlatJSOM = () => {
            return {
                __html: 'var marktRowsFlat = ' + JSON.stringify(rowsFlat) + ';',
            };
        };

        return (
            <form
                className="Form Form--PlaatsvoorkeurenForm"
                method="POST"
                action="/voorkeuren/"
                encType="application/x-www-form-urlencoded"
                // data-decorator="voorkeur-form"
            >
                <input
                    id="erkenningsNummer"
                    type="hidden"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                />
                <p>
                    Je kunt de plaatsvoorkeuren voor morgen tot 21.00 wijzigen. Wijzig je de plaatsvoorkeuren na 21.00
                    uur dan gelden deze voor de dagen na morgen.
                </p>

                <div className="PlaatsvoorkeurenForm__markt" data-markt-id={markt.id}>
                    <script dangerouslySetInnerHTML={marktRowsJSOM()} />
                    <script dangerouslySetInnerHTML={plaatsSetsJSON()} />
                    <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
                    <div className="PlaatsvoorkeurenForm__plaats-count-limit">
                        <div className="InputField InputField--range">
                            <label>Minimaal aantal plaatsen</label>
                            <div className="InputField--range__wrapper">
                                <input name="min" type="range" min="0" max={newPlaatsvoorkeurCount} value={0} />
                                <ul className="InputField--range__value-list">
                                    {Array.from(new Array(newPlaatsvoorkeurCount)).map((r, i) => (
                                        <li key={i} className="InputField--range__value-list-item">
                                            {i + 1}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="InputField InputField--range">
                            <label>Maximaal aantal plaatsen</label>
                            <div className="InputField--range__wrapper">
                                <input name="max" type="range" min="0" max={newPlaatsvoorkeurCount} value={0} />
                                <ul className="InputField--range__value-list">
                                    {Array.from(new Array(newPlaatsvoorkeurCount)).map((r, i) => (
                                        <li key={i} className="InputField--range__value-list-item">
                                            {i + 1}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {isVast(sollicitatie.status) ? (
                        <p>
                            Je vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null}:{' '}
                            <strong>{sollicitatie.vastePlaatsen.join(' en ')}</strong>
                        </p>
                    ) : null}
                    <div className="PlaatsvoorkeurenForm__list">
                        {entriesSplit.map((entries, i, entriesArray) => (
                            <div
                                className={`PlaatsvoorkeurenForm__list-item ${
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
                                <h5 className="PlaatsvoorkeurenForm__list-item__heading">{i + 1}e keuze</h5>
                                <div className="well">
                                    <span className="PlaatsvoorkeurenForm__list-item__label">Plaatsen:</span>
                                    {entries
                                        .sort((a, b) => b.priority - a.priority)
                                        .map(({ marktId, plaatsId, priority, index, readonly, newItem }, n, arr) => (
                                            <div key={index} className={`PlaatsvoorkeurenForm__list-item__wrapper`}>
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
                                                <input
                                                    type="hidden"
                                                    name={`plaatsvoorkeuren[${index}][plaatsId]`}
                                                    value={plaatsId}
                                                />
                                                <span className="PlaatsvoorkeurenForm__list-item__value">
                                                    {plaatsId}
                                                </span>
                                            </div>
                                        ))}
                                    <div className="PlaatsvoorkeurenForm__list-item__tools">
                                        <a
                                            href="#"
                                            data-handler="remove-voorkeur"
                                            className="PlaatsvoorkeurenForm__list-item__tools-del"
                                        >
                                            verwijder
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div
                        className="PlaatsvoorkeurenForm__prototype"
                        data-plaatsvoorkeur-count={newPlaatsvoorkeurCount}
                        data-markt-id={markt.id}
                        // data-decorator="plaatsvoorkeur-prototype"
                        data-used-plaatsen={`p=${entriesFiltered.map(entry => entry.plaatsId).join('&p=')}`}
                        data-select-base-id={entriesFiltered.length}
                        data-max-uitbreidingen={1}
                    >
                        <div className="PlaatsvoorkeurenForm__list-item">
                            <h5 className="PlaatsvoorkeurenForm__list-item__heading">
                                {entriesSplit.length + 1}e keuze
                            </h5>
                            <div className="well">
                                <span className="PlaatsvoorkeurenForm__list-item__label">Kies een marktplaats</span>
                                <div className={`PlaatsvoorkeurenForm__list-item__wrapper`}>
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${entriesFiltered.length + 1}][marktId]`}
                                        defaultValue={markt.id}
                                    />
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${entriesFiltered.length + 1}][priority]`}
                                        defaultValue={2}
                                    />
                                    <MarktplaatsSelect
                                        name={`plaatsvoorkeuren[${entriesFiltered.length + 1}][plaatsId]`}
                                        id={`voorkeur-${entriesFiltered.length + 1}`}
                                        markt={markt}
                                        data={rowsFlat}
                                        optional={true}
                                    />
                                </div>
                                <a
                                    href="#"
                                    data-handler="clear-select"
                                    className="PlaatsvoorkeurenForm__list-item__clear"
                                >
                                    leeg maken
                                </a>
                            </div>
                        </div>
                    </div>
                    <p className="InputField InputField--submit" id="bottom-buttons">
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="redirectTo"
                            value={`/voorkeuren/${ondernemer.erkenningsnummer}/${
                                markt.id
                            }/?&next=${next}#modal-submit-buttons`}
                        >
                            Bewaar
                        </button>
                        <Button label="terug" href={`${next}#plaatsvoorkeuren`} type="tertiary" />
                    </p>
                </div>
                <div
                    data-decorator="initial-modal"
                    className="hidden"
                    id="submit-buttons"
                    data-content-id="submit-buttons"
                >
                    <h2>Je keuze is bewaard</h2>
                    <p>Je kunt meerdere keuzes toevoegen om je kans op een gewenste plaats te vergroten.</p>
                    <p className="InputField InputField--submit">
                        <a className="Button Button--secondary" href="#" data-handler="modal-close">
                            + Voeg nog een keuze toe
                        </a>
                        <a
                            className="Button Button--tertiary"
                            href={`/markt-detail/${ondernemer.erkenningsnummer}/${markt.id}/#plaatsvoorkeuren`}
                        >
                            Terug naar marktoverzicht
                        </a>
                    </p>
                </div>
            </form>
        );
    }
}

module.exports = PlaatsvoorkeurenForm;

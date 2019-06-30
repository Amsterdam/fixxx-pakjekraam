const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName } = require('../../domain-knowledge.js');
const { flatten } = require('../../util.js');
const MarktplaatsSelect = require('./MarktplaatsSelect');
const Button = require('./Button');
const OndernemerMarktHeading = require('./OndernemerMarktHeading');

class PlaatsvoorkeurenForm extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        markten: PropTypes.array.isRequired,
        ondernemer: PropTypes.object.isRequired,
        rows: PropTypes.array.isRequired,
        query: PropTypes.string,
    };

    render() {
        const { markten, ondernemer, plaatsvoorkeuren, query, rows } = this.props;

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

        const allEntries = [...voorkeurEntries].map((entry, index) => ({
            ...entry,
            index,
        }));

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
                {markten.map(markt => {
                    const next = query.next ? query.next : `/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/`;
                    const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id);
                    const newPlaatsvoorkeurCount =
                        sollicitatie.vastePlaatsen.length > 0 ? sollicitatie.vastePlaatsen.length : 1;
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

                    const marktRowsJSOM = () => {
                        return { __html: 'var marktRows = ' + JSON.stringify(rows) + ';' };
                    };
                    const plaatsSetsJSON = () => {
                        return { __html: 'var plaatsenSets = ' + JSON.stringify(plaatsSets) + ';' };
                    };

                    return (
                        <div key={markt.id} className="PlaatsvoorkeurenForm__markt" data-markt-id={markt.id}>
                            <script dangerouslySetInnerHTML={marktRowsJSOM()} />
                            <script dangerouslySetInnerHTML={plaatsSetsJSON()} />
                            <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
                            {sollicitatie.status === 'vpl' ? (
                                <div className="well well--dark margin-bottom">
                                    Je vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null}:{' '}
                                    <strong>{sollicitatie.vastePlaatsen.join(' en ')}</strong>
                                </div>
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
                                                .map(
                                                    (
                                                        { marktId, plaatsId, priority, index, readonly, newItem },
                                                        n,
                                                        arr,
                                                    ) => (
                                                        <div
                                                            key={index}
                                                            className={`PlaatsvoorkeurenForm__list-item__wrapper`}
                                                        >
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
                                                    ),
                                                )}
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
                                data-decorator="plaatsvoorkeur-prototype"
                                data-used-plaatsen={`p=${entriesFiltered.map(entry => entry.plaatsId).join('&p=')}`}
                                data-select-base-id={entriesFiltered.length}
                                data-max-uitbreidingen={1}
                            >
                                <div className="PlaatsvoorkeurenForm__list-item">
                                    <h5 className="PlaatsvoorkeurenForm__list-item__heading">
                                        {entriesSplit.length + 1}e keuze
                                    </h5>
                                    <div className="well">
                                        <span className="PlaatsvoorkeurenForm__list-item__label">
                                            Kies een marktplaats
                                        </span>

                                        {Array.from(Array(newPlaatsvoorkeurCount)).map((v, i) => (
                                            <div key={i} className={`PlaatsvoorkeurenForm__list-item__wrapper`}>
                                                <input
                                                    type="hidden"
                                                    name={`plaatsvoorkeuren[${entriesFiltered.length + i}][marktId]`}
                                                    defaultValue={markt.id}
                                                />
                                                <input
                                                    type="hidden"
                                                    name={`plaatsvoorkeuren[${entriesFiltered.length + i}][priority]`}
                                                    defaultValue={2}
                                                />
                                                <MarktplaatsSelect
                                                    name={`plaatsvoorkeuren[${entriesFiltered.length + i}][plaatsId]`}
                                                    id={`voorkeur-${entriesFiltered.length + i}`}
                                                    markt={markt}
                                                    readonly={true}
                                                    newItem={true}
                                                    optional={true}
                                                />
                                            </div>
                                        ))}
                                        <div className={`PlaatsvoorkeurenForm__list__tools`}>
                                            <a
                                                data-handler="add-plaats"
                                                href="#"
                                                className="PlaatsvoorkeurenForm__add-wrapper"
                                            >
                                                add
                                            </a>
                                            <a
                                                data-handler="remove-plaats"
                                                href="#"
                                                className="PlaatsvoorkeurenForm__remove-wrapper"
                                            >
                                                remove
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="InputField InputField--submit">
                                <button
                                    className="Button Button--secondary"
                                    type="submit"
                                    name="redirectTo"
                                    value={`/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=${
                                        query.next
                                            ? query.next
                                            : `/markt-detail/${ondernemer.erkenningsnummer}/${markt.id}/`
                                    }`}
                                >
                                    Opslaan
                                </button>
                                <Button
                                    label="terug"
                                    href={
                                        query.next
                                            ? query.next
                                            : `/markt-detail/${ondernemer.erkenningsnummer}/${markt.id}/`
                                    }
                                    type="tertiary"
                                />
                            </p>
                        </div>
                    );
                })}
            </form>
        );
    }
}

module.exports = PlaatsvoorkeurenForm;

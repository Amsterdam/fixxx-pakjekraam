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
        indelingVoorkeur: PropTypes.object,
        rows: PropTypes.array.isRequired,
        query: PropTypes.string,
    };

    render() {
        const { markt, ondernemer, plaatsvoorkeuren, query, rows, indelingVoorkeur } = this.props;
        const defaultVoorkeur = {
            aantalPlaatsen: 1,
            anwhere: true,
            inactive: false,
        };

        const voorkeur = indelingVoorkeur || defaultVoorkeur;

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

        const next = query.next ? query.next : `./`;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
        const maxCountUitbreidingenMarkt = 2;
        const defaultPlaatsCount = isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1;
        const newPlaatsvoorkeurCount =
            sollicitatie.vastePlaatsen.length > 0
                ? sollicitatie.vastePlaatsen.length + maxCountUitbreidingenMarkt
                : 1 + maxCountUitbreidingenMarkt;
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
                name="plaatsvoorkeur-form"
                action="./"
                encType="application/x-www-form-urlencoded"
                data-decorator="voorkeur-form"
                data-vasteplaats-count={sollicitatie.vastePlaatsen.length}
            >
                <input
                    id="erkenningsNummer"
                    type="hidden"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                />
                <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
                <p>
                    Je kunt de plaatsvoorkeuren voor morgen tot 21.00 wijzigen. Wijzig je de plaatsvoorkeuren na 21.00
                    uur dan gelden deze voor de dagen na morgen.
                </p>

                <div className="PlaatsvoorkeurenForm__markt" data-markt-id={markt.id}>
                    <script dangerouslySetInnerHTML={marktRowsJSOM()} />
                    <script dangerouslySetInnerHTML={plaatsSetsJSON()} />

                    <div className="Fieldset PlaatsvoorkeurenForm__plaats-count">
                        <h2 className="Fieldset__header">Aantal plaatsen</h2>
                        <span className="Fieldset__sub-header">
                            Hoeveel plaatsen hebt u <strong>echt nodig</strong>?
                        </span>
                        <div className="PlaatsvoorkeurenForm__plaats-count__wrapper">
                            {Array.from(new Array(newPlaatsvoorkeurCount)).map((r, i) => (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        id={`default-count-${i + 1}`}
                                        value={`${i + 1}`}
                                        data-val={`${i + 1}`}
                                        name="default-count"
                                        {...{ defaultChecked: defaultPlaatsCount === i + 1 }}
                                    />
                                    <label htmlFor={`default-count-${i + 1}`}>{i + 1}</label>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="Fieldset PlaatsvoorkeurenForm__plaats-count extra">
                        <h2 className="Fieldset__header">Extra plaatsen</h2>
                        <span className="Fieldset__sub-header">
                            Hoeveel <strong>extra</strong> plaatsen wilt u daar nog bij - als er genoeg plek is?
                        </span>
                        <div className="PlaatsvoorkeurenForm__plaats-count__wrapper extra">
                            {['geen', '1', '2'].map((r, i) => (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        id={`extra-count-${i}`}
                                        value={`${i}`}
                                        name="extra-count"
                                        {...{ defaultChecked: i === 0 }}
                                    />
                                    <label htmlFor={`extra-count-${i}`}>
                                        {i !== 0 ? '+' : ''}
                                        {r}
                                    </label>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Plaatsvoorkeuren</h2>
                        {isVast(sollicitatie.status) ? (
                            <span className="Fieldset__sub-header">
                                Je vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null}:{' '}
                                <strong>{sollicitatie.vastePlaatsen.join(' en ')}</strong>
                            </span>
                        ) : null}
                        <p>U kunt zoveel voorkeuren invullen als u wilt.</p>
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
                                    <h4 className="PlaatsvoorkeurenForm__list-item__heading">{i + 1}e voorkeur</h4>
                                    <h4 className="PlaatsvoorkeurenForm__list-item__heading-remove">
                                        {i + 1}e voorkeur wordt verwijderd na bewaren.
                                    </h4>
                                    <div className="well">
                                        <span className="PlaatsvoorkeurenForm__list-item__label">
                                            Plaatsnummer:{' '}
                                            <strong>
                                                {entries
                                                    .map(e => {
                                                        return e.plaatsId;
                                                    })
                                                    .join('')}
                                            </strong>
                                        </span>
                                        {entries
                                            .sort((a, b) => b.priority - a.priority)
                                            .map(
                                                ({ marktId, plaatsId, priority, index, readonly, newItem }, n, arr) => (
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
                                                        {/* <span className="PlaatsvoorkeurenForm__list-item__value">*/}
                                                        {/* {plaatsId}*/}
                                                        {/* </span>*/}
                                                        {/* <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__min-extra">*/}
                                                        {/* <span className="count" />*/}
                                                        {/* &nbsp;extra plaats*/}
                                                        {/* </div>*/}
                                                        {/* <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__optional">*/}
                                                        {/* <span className="count" />*/}
                                                        {/* &nbsp;extra&nbsp;als er&nbsp;plek&nbsp;is.*/}
                                                        {/* </div>*/}
                                                    </div>
                                                ),
                                            )}
                                        <span className="PlaatsvoorkeurenForm__list-item__explain">
                                            Ik wil minimaal <span className="min" /> plaats
                                            <span className="minMulti">en</span>
                                            <span className="extra">
                                                , en nog <span className="max" /> plaats
                                                <span className="maxMulti">en</span> erbij als er plek is.
                                            </span>
                                        </span>
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
                                <h4 className="PlaatsvoorkeurenForm__list-item__heading">
                                    {entriesSplit.length + 1}e voorkeur
                                </h4>
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
                                        <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__min-extra" />
                                        <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__optional" />
                                    </div>
                                    <span className="PlaatsvoorkeurenForm__list-item__explain">
                                        Ik wil minimaal <span className="min" /> plaats
                                        <span className="minMulti">en</span>
                                        <span className="extra">
                                            , en nog <span className="max" /> plaats<span className="maxMulti">en</span>{' '}
                                            erbij als er plek is.
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        {Array.from(new Array(0)).map((r, i) => (
                            <div
                                className="PlaatsvoorkeurenForm__prototype ghost"
                                data-plaatsvoorkeur-count={newPlaatsvoorkeurCount}
                                data-markt-id={markt.id}
                                // data-decorator="plaatsvoorkeur-prototype"
                                data-used-plaatsen={`p=${entriesFiltered.map(entry => entry.plaatsId).join('&p=')}`}
                                data-select-base-id={entriesFiltered.length}
                                data-max-uitbreidingen={1}
                                key={i}
                            >
                                <div className="PlaatsvoorkeurenForm__list-item">
                                    <h4 className="PlaatsvoorkeurenForm__list-item__heading">
                                        {entriesSplit.length + (i + 2)}e voorkeur
                                    </h4>
                                    <div className="well">
                                        <span className="PlaatsvoorkeurenForm__list-item__label">
                                            Kies een marktplaats
                                        </span>
                                        <div className={`PlaatsvoorkeurenForm__list-item__wrapper`}>
                                            <MarktplaatsSelect
                                                name={`plaatsvoorkeuren[${entriesFiltered.length + 1}][plaatsId]`}
                                                id={`voorkeur-${entriesFiltered.length + 1}`}
                                                markt={markt}
                                                data={rowsFlat}
                                                optional={true}
                                                readonly="disabled"
                                            />
                                            <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__min-extra" />
                                            <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__optional" />
                                        </div>
                                        <span className="PlaatsvoorkeurenForm__list-item__explain">
                                            Ik wil minimaal <span className="min" /> plaats
                                            <span className="minMulti">en</span>
                                            <span className="extra">
                                                , en nog <span className="max" /> plaats
                                                <span className="maxMulti">en</span> erbij als er plek is.
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <input type="hidden" name="marktId" defaultValue={markt.id} />
                        <div className={`Fieldset`}>
                            <h2 className="Fieldset__header">Flexibel indelen?</h2>
                            <p className="InputField InputField--checkbox">
                                <input
                                    id="anywhere"
                                    type="checkbox"
                                    name="anywhere"
                                    defaultChecked={voorkeur.anywhere !== false}
                                />
                                <label htmlFor="anywhere">
                                    Als mijn voorkeursplaatsen niet beschikbaar zijn, wil ik automatisch op een losse
                                    plaats ingedeeld worden.
                                </label>
                            </p>
                        </div>
                    </div>

                    <p className="InputField InputField--submit" id="bottom-buttons">
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="redirectTo"
                            value={`./?error=plaatsvoorkeuren-saved&next=${next}#bottom-buttons`}
                        >
                            Bewaar
                        </button>
                        <Button label="Annuleer" href={`${next}#plaatsvoorkeuren`} type="tertiary" />
                    </p>
                </div>
                <div
                    // data-decorator="initial-modal"
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
                            href={`../../markt-detail/${markt.id}/#plaatsvoorkeuren`}
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

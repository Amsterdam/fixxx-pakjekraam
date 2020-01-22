const React = require('react');
const PropTypes = require('prop-types');
const { plaatsSort, isVastOfExp, isExp } = require('../../domain-knowledge.js');
const MarktplaatsSelect = require('./MarktplaatsSelect');
const Button = require('./Button');
const Form = require('./Form');

const { getDefaultVoorkeur } = require('../../model/voorkeur.functions');

class PlaatsvoorkeurenForm extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        markt: PropTypes.object.isRequired,
        ondernemer: PropTypes.object.isRequired,
        indelingVoorkeur: PropTypes.object,
        plaatsen: PropTypes.array.isRequired,
        role: PropTypes.string,
        sollicitatie: PropTypes.object.isRequired,
        csrfToken: PropTypes.string,
    };

    render() {
        const { markt, ondernemer, marktplaatsen, indelingVoorkeur, role, sollicitatie, csrfToken } = this.props;
        let { plaatsvoorkeuren } = this.props;

        const voorkeur = indelingVoorkeur || getDefaultVoorkeur(sollicitatie);

        let minimumCount = null;
        if (role === 'marktmeester') {
            minimumCount = sollicitatie.vastePlaatsen.length > 0
                    ? sollicitatie.vastePlaatsen.length + 2
                    : 3;
        } else {
            minimumCount = sollicitatie.vastePlaatsen.length > 0
                    ? sollicitatie.vastePlaatsen.length
                    : 3;
        }

        const minimumDisabled = isVastOfExp(sollicitatie.status) && role !== 'marktmeester';

        const minimumChecked = i => {
            if (isVastOfExp(sollicitatie.status) && role !== 'marktmeester') {
                if (sollicitatie.vastePlaatsen.length === i + 1) {
                    return true;
                } else {
                    return false;
                }
            } else if (voorkeur.minimum === i + 1) {
                return true;
            } else {
                return false;
            }
        };

        const defaultCheckedMax = i => {
            if ((voorkeur.maximum - voorkeur.minimum) === i) {
                return true;
            } else {
                return false;
            }
        };

        const plaatsenDuiding = plaatsen => {
            return plaatsen.length > 1 ? 'plaatsen' : 'plaats';
        };

        const plaatsNummerDuiding = plaatsen => {
            return plaatsen.length > 1 ? 'plaatsnummers' : 'plaatsnummer';
        };

        const isMarktmeesterEnVph = (role === 'marktmeester' && isVastOfExp(sollicitatie.status));

        plaatsvoorkeuren = plaatsvoorkeuren.map((plaatsvoorkeur, index) => {
                return {
                    marktId: plaatsvoorkeur.marktId,
                    erkenningsNummer: plaatsvoorkeur.erkenningsNummer,
                    plaatsId: plaatsvoorkeur.plaatsId,
                    priority: plaatsvoorkeur.priority,
                    readonly: false,
                    newItem: false,
                };
            })
            .sort((a, b) => b.priority - a.priority);

        marktplaatsen
            .sort((a, b) => plaatsSort(a, b, 'plaatsId'))
            .map(plaats => {
                plaats.disabled = !!(plaatsvoorkeuren.find(entry => (entry.plaatsId === plaats.plaatsId)));
                return plaats;
            });

        return (
            <Form
                className="Form Form--PlaatsvoorkeurenForm"
                csrfToken={csrfToken}
                decorator="voorkeur-form"
            >
                <input
                    id="erkenningsNummer"
                    type="hidden"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                />

                <div className="PlaatsvoorkeurenForm__markt" data-markt-id={markt.id}>
                    <input name="maximum" id="maximum" type="hidden" defaultValue={voorkeur.maximum} />
                    <div className={"Fieldset PlaatsvoorkeurenForm__plaats-count " + (isMarktmeesterEnVph ? 'Fieldset--highlighted' : null)}>
                        {isMarktmeesterEnVph ?
                            <p className="Fieldset__highlight-text">Verouderde functie! Alleen aanpassen als je weet wat je doet.</p> : null
                        }
                        <h2 className="Fieldset__header">
                            {isVastOfExp(sollicitatie.status) ? `Uw vaste ${plaatsenDuiding(sollicitatie.vastePlaatsen)}` : 'Aantal plaatsen'}
                        </h2>
                        <span className="Fieldset__sub-header">
                            {isVastOfExp(sollicitatie.status)
                                ? `${plaatsNummerDuiding(sollicitatie.vastePlaatsen)}: ${sollicitatie.vastePlaatsen.join(', ')}`
                                : <span>Hoeveel plaatsen hebt u <strong>echt nodig</strong>?</span>
                            }
                        </span>

                        <div className="PlaatsvoorkeurenForm__plaats-count__wrapper">
                            {Array.from(new Array(minimumCount)).map((r, i) => (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        id={`default-count-${i + 1}`}
                                        value={`${i + 1}`}
                                        data-val={`${i + 1}`}
                                        name="minimum"
                                        disabled={minimumDisabled}
                                        {...{ defaultChecked: minimumChecked(i) }}
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
                                        {...{ defaultChecked: defaultCheckedMax(i) }}
                                    />
                                    <label htmlFor={`extra-count-${i}`}>
                                        {i !== 0 ? '+' : ''}
                                        {r}
                                    </label>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    { !isExp(sollicitatie.status) ?
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Plaatsen selecteren</h2>
                        <span className="Fieldset__sub-header">U kunt zoveel voorkeuren invullen als u wilt.</span>
                        <div className="Icon-line">
                            <img className="Icon-line__icon" src="/images/draggable.svg" alt="Unchecked" />
                            <p className="Icon-line__text">Verander de volgorde van de plaatsnummers door ze op de juiste plaats te slepen.</p>
                        </div>
                        <h4 className="Fieldset__sub-header"><strong>Plaatsnummers</strong></h4>
                        <div className="PlaatsvoorkeurenForm__list">
                            {plaatsvoorkeuren.map((entry, index) => (
                                <div className="Draggable-list-item" id="plaatsvoorkeuren-list-item" key={entry.id}>
                                    <div className="Draggable-list-item__handle">
                                        <div className="Draggable-list-item__handle__bar"></div>
                                        <div className="Draggable-list-item__handle__bar"></div>
                                    </div>
                                    <div className="Draggable-list-item__left">
                                        <span className="Draggable-list-item__label">
                                            <strong>{entry.plaatsId}</strong>
                                        </span>
                                    </div>
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][marktId]`}
                                        defaultValue={entry.marktId}
                                    />
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][priority]`}
                                        defaultValue={plaatsvoorkeuren.length - index}
                                    />
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][plaatsId]`}
                                        value={entry.plaatsId}
                                    />
                                    <a href="#" data-handler="remove-voorkeur" className="Draggable-list-item__right">
                                        <span className="Draggable-list-item__delete">
                                        </span>
                                    </a>
                                </div>
                            ))}
                        </div>
                        <div
                            className="PlaatsvoorkeurenForm__prototype"
                            data-plaatsvoorkeur-count={minimumCount}
                            data-markt-id={markt.id}
                            data-decorator="plaatsvoorkeur-prototype"
                            data-used-plaatsen={`p=${plaatsvoorkeuren.map(entry => entry.plaatsId).join('&p=')}`}
                            data-select-base-id={plaatsvoorkeuren.length}
                            data-max-uitbreidingen={1}
                        >
                            <div className="PlaatsvoorkeurenForm__list-item" id="plaatsvoorkeuren-list-item">
                                <h4 className="PlaatsvoorkeurenForm__list-item__heading Fieldset__sub-header">
                                    Plaatsvoorkeur toevoegen
                                </h4>
                                <div className="well well--small">
                                    <span className="PlaatsvoorkeurenForm__list-item__label">Kies een marktplaats</span>
                                    <div className={`PlaatsvoorkeurenForm__list-item__wrapper`}>
                                        <input
                                            type="hidden"
                                            name={`plaatsvoorkeuren[${plaatsvoorkeuren.length + 1}][marktId]`}
                                            defaultValue={markt.id}
                                        />
                                        <input
                                            type="hidden"
                                            name={`plaatsvoorkeuren[${plaatsvoorkeuren.length + 1}][priority]`}
                                            defaultValue={2}
                                        />
                                        <MarktplaatsSelect
                                            name={`plaatsvoorkeuren[${plaatsvoorkeuren.length + 1}][plaatsId]`}
                                            id={`voorkeur-${plaatsvoorkeuren.length + 1}`}
                                            markt={markt}
                                            data={marktplaatsen}
                                            optional={true}
                                        />
                                        <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__min-extra" />
                                        <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__optional" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dit veld willen we alleen laten zien aan marktmeesters en sollicitanten */}
                        {role == 'marktmeester' || !isVastOfExp(sollicitatie.status) ? (
                            <div className={`Fieldset ${isMarktmeesterEnVph ? 'Fieldset--highlighted' : null}`}>
                                {isMarktmeesterEnVph ?
                                    <p className="Fieldset__highlight-text">Verouderde functie! Alleen aanpassen als je weet wat je doet.</p> : null
                                }
                                <h2 className="Fieldset__header">
                                    Flexibel indelen?
                                    <br />
                                    Dan deelt het systeem u in op beschikbare plaatsen.
                                </h2>
                                <p className="InputField InputField--checkbox">
                                    <input
                                        id="anywhere"
                                        type="checkbox"
                                        name="anywhere"
                                        defaultChecked={voorkeur.anywhere}
                                    />
                                    <label htmlFor="anywhere">
                                        {isVastOfExp(sollicitatie.status) ? (
                                            <span>
                                                Ja, ik wil liever kunnen vergroten dan alleen op mijn eigen plaats(en)
                                                staan.
                                            </span>
                                        ) : (
                                                <span>
                                                    Als mijn voorkeursplaatsen niet beschikbaar zijn, wil ik automatisch op een
                                                    losse plaats ingedeeld worden.
                                            </span>
                                            )}
                                    </label>
                                </p>
                            </div>
                        ) : null}
                    </div>
                    : null }

                    <p className="InputField InputField--submit" id="bottom-buttons">
                        <Button
                            label="Voorkeuren"
                            href={
                                role === 'marktmeester'
                                    ? `/profile/${ondernemer.erkenningsnummer}`
                                    : `/markt-detail/${markt.id}#plaatsvoorkeuren`
                            }
                            type="tertiary"/>
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="redirectTo"
                            value={`${
                                role === 'marktmeester'
                                    ? `/profile/${ondernemer.erkenningsnummer}?error=plaatsvoorkeuren-saved`
                                    : `/markt-detail/${markt.id}?error=plaatsvoorkeuren-saved#plaatsvoorkeuren`
                                }`}>
                            Bewaar
                        </button>
                    </p>
                </div>
            </Form>
        );
    }
}

module.exports = PlaatsvoorkeurenForm;

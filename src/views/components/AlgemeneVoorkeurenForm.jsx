const React = require('react');
const PropTypes = require('prop-types');
const { formatDate, numberSort, dateToDDMMYYYY, yyyyMmDdtoDDMMYYYY } = require('../../util.ts');
const { formatOndernemerName, parseISOMarktDag, isVast } = require('../../domain-knowledge.js');
const {
    ISO_SUNDAY,
    ISO_MONDAY,
    ISO_TUESDAY,
    ISO_WEDNESDAY,
    ISO_THURSDAY,
    ISO_FRIDAY,
    ISO_SATURDAY,
    formatISODayOfWeek,
} = require('../../util.ts');
const Button = require('./Button');
const Form = require('./Form');
const OndernemerMarktHeading = require('./OndernemerMarktHeading');


class AlgemeneVoorkeurenForm extends React.Component {
    propTypes = {
        marktId: PropTypes.string,
        marktDate: PropTypes.string,
        ondernemer: PropTypes.object.isRequired,
        markt: PropTypes.object,
        voorkeur: PropTypes.array,
        branches: PropTypes.array.isRequired,
        next: PropTypes.string,
        query: PropTypes.string,
        role: PropTypes.string,
        csrfToken: PropTypes.string,
    };

    render() {
        const { branches, ondernemer, markt, marktId, marktDate, next, query, role, csrfToken } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
        const nextMessage =
            (query && query.next) || '/markt-detail/' + ondernemer.erkenningsnummer + '/' + marktId + '/';
        const defaultPlaatsCount = isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1;
        const defaultVoorkeur = {
            minimum: defaultPlaatsCount,
            maximum: defaultPlaatsCount,
            anwhere: true,
            inactive: false,
        };

        const voorkeur = this.props.voorkeur || defaultVoorkeur;

        if (voorkeur.absentFrom) {
            voorkeur.absentFrom = yyyyMmDdtoDDMMYYYY(voorkeur.absentFrom);
        }

        if (voorkeur.absentUntil) {
            voorkeur.absentUntil = yyyyMmDdtoDDMMYYYY(voorkeur.absentUntil);
        }

        let weekDays = [ISO_MONDAY, ISO_TUESDAY, ISO_WEDNESDAY, ISO_THURSDAY, ISO_FRIDAY, ISO_SATURDAY, ISO_SUNDAY];

        // TODO: When `markt` is available, filter `weekDays` to exclude days on which the market is not held.
        if (markt && markt.marktDagen) {
            weekDays = markt.marktDagen.map(parseISOMarktDag);
        }

        weekDays.sort(numberSort);

        return (

            <Form csrfToken={csrfToken}>
                <h1>Marktprofiel</h1>
                <OndernemerMarktHeading sollicitatie={sollicitatie} markt={markt} />
                <div className="well well--max-width">
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Wat voor koopwaar verkoopt u?</h2>
                        <div className="InputField">
                            <div className="Select__wrapper">
                                <select id="brancheId" name="brancheId" className="Select">
                                    <option />
                                    {branches
                                        // .sort((a, b) => {
                                        //     const nameA = a.description.toLowerCase(),
                                        //         nameB = b.description.toLowerCase();
                                        //     if (nameA < nameB) return -1;
                                        //     if (nameA > nameB) return 1;

                                        //     return 0;
                                        // })
                                        .map(branche => (
                                            <option
                                                key={branche.brancheId}
                                                value={branche.brancheId}
                                                selected={branche.brancheId === voorkeur.brancheId}
                                            >
                                                {branche.description}
                                            </option>
                                        ))}
                                </select>{' '}
                            </div>
                        </div>
                    </div>
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Hebt u een bakplaats nodig?</h2>
                        <p className="InputField InputField--checkbox">
                            <input
                                id="parentBrancheId"
                                type="checkbox"
                                name="parentBrancheId"
                                defaultValue="bak"
                                defaultChecked={voorkeur.parentBrancheId === 'bak'}
                            />
                            <label htmlFor="parentBrancheId">Ja, ik ga koken, bakken of frituren.</label>
                        </p>
                    </div>
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Wilt u met eigen materiaal staan?</h2>
                        <p className="InputField InputField--checkbox">
                            <input
                                id="inrichting"
                                type="checkbox"
                                name="inrichting"
                                defaultValue="eigen-materieel"
                                defaultChecked={voorkeur.inrichting === 'eigen-materieel'}
                            />
                            <label htmlFor="inrichting">Ja, ik kom met een eigen verkoopwagen/eigen materiaal.</label>
                        </p>
                    </div>
                    <div className="hidden">
                        <h2 className="Fieldset__header">Hoeveel plaatsen hebt u echt nodig?</h2>
                        <p className="InputField InputField--number">
                            <label htmlFor="minimum" className="Label">
                                Minimaal aantal kramen:
                            </label>
                            <input
                                name="minimum"
                                id="minimum"
                                type="number"
                                defaultValue={voorkeur.minimum}
                                className="Input Input--small"
                                width={5}
                            />
                        </p>
                    </div>
                    <div className="hidden">
                        <h2 className="Fieldset__header">
                            Als er ruimte is, hoeveel plaatsen zou je graag in totaal willen?
                        </h2>
                        <p className="InputField InputField--number">
                            <label htmlFor="maximum" className="Label">
                                Maximaal aantal kramen:
                            </label>
                            <input
                                name="maximum"
                                id="maximum"
                                type="number"
                                defaultValue={voorkeur.maximum}
                                className="Input Input--small"
                                width={5}
                            />
                        </p>
                    </div>
                    { role == 'marktmeester' ? (
                        <div className={`Fieldset Fieldset--highlighted`}>
                            <p className="Fieldset__highlight-text">Functie speciaal voor marktmeesters! Alleen aanpassen als je weet wat je doet.</p>
                            <h2 className="Fieldset__header">Langdurige afwezigheid</h2>
                            <p className="InputField  InputField--text">
                                <label className="Label" htmlFor="absentFrom">Afwezig vanaf (dd-mm-yyyy): </label>
                                <input
                                    id="absentFrom"
                                    type="text"
                                    name="absentFrom"
                                    placeholder="dd-mm-yyyy"
                                    className="Input Input--medium"
                                    value={voorkeur.absentFrom}
                                />
                            </p>
                            <p className="InputField InputField--text">
                                <label className="Label" htmlFor="absentUntil">Afwezig tot en met (dd-mm-yyyy):</label>
                                <input
                                    id="absentUntil"
                                    type="text"
                                    name="absentUntil"
                                    placeholder="dd-mm-yyyy"
                                    className="Input Input--medium"
                                    value={voorkeur.absentUntil}
                                />
                            </p>
                        </div>
                    ) : null }
                </div>

                <div className="Fieldset">
                    <p className="InputField InputField--submit">
                        <input
                            id="erkenningsNummer"
                            type="hidden"
                            name="erkenningsNummer"
                            defaultValue={ondernemer.erkenningsnummer}
                        />
                        <input type="hidden" name="marktId" defaultValue={marktId} />
                        <input type="hidden" name="marktDate" defaultValue={marktDate} />
                        <input type="hidden" name="anywhere" defaultValue={voorkeur.anywhere !== false && 'on'} />
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="next"
                            value={`${
                                role === 'marktmeester'
                                    ? `/profile/${ondernemer.erkenningsnummer}?error=algemene-voorkeuren-saved`
                                    : `/markt-detail/${markt.id}?error=algemene-voorkeuren-saved#marktprofiel`
                            }`}
                        >
                            Bewaar
                        </button>
                        <a
                            className="Button Button--tertiary"
                            href={`${
                                role === 'marktmeester'
                                    ? `/profile/${ondernemer.erkenningsnummer}`
                                    : `/markt-detail/${markt.id}#marktprofiel`
                            }`}
                        >
                            Annuleer
                        </a>
                    </p>
                </div>
            </Form>
        );
    }
}
module.exports = AlgemeneVoorkeurenForm;

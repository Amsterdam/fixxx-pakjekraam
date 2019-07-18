const React = require('react');
const PropTypes = require('prop-types');
const { formatDate, numberSort } = require('../../util.ts');
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
    };

    render() {
        const { branches, ondernemer, markt, marktId, marktDate, next, query, role } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
        const nextMessage =
            (query && query.next) || '/markt-detail/' + ondernemer.erkenningsnummer + '/' + marktId + '/';
        const advanced = (query && query.advanced) || false;
        const defaultVoorkeur = {
            mimimum: 1,
            maximum: 1,
            anwhere: true,
            inactive: false,
        };

        const voorkeur = this.props.voorkeur || defaultVoorkeur;

        let weekDays = [ISO_MONDAY, ISO_TUESDAY, ISO_WEDNESDAY, ISO_THURSDAY, ISO_FRIDAY, ISO_SATURDAY, ISO_SUNDAY];

        // TODO: When `markt` is available, filter `weekDays` to exclude days on which the market is not held.
        if (markt && markt.marktDagen) {
            weekDays = markt.marktDagen.map(parseISOMarktDag);
        }

        weekDays.sort(numberSort);

        const dayKey = {
            [ISO_MONDAY]: 'monday',
            [ISO_TUESDAY]: 'tuesday',
            [ISO_WEDNESDAY]: 'wednesday',
            [ISO_THURSDAY]: 'thursday',
            [ISO_FRIDAY]: 'friday',
            [ISO_SATURDAY]: 'saturday',
            [ISO_SUNDAY]: 'sunday',
        };

        /*
         * TODO: `ondernemer` should be our `IMarktondernemer` object,
         * not the `ondernemer` from Makkelijke Markt.
         */
        const vast = isVast(ondernemer.status) || true;

        return (
            <form
                className="Form Form--AlgemeneVoorkeurenForm"
                method="POST"
                action="./"
                encType="application/x-www-form-urlencoded"
            >
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
                                        .sort((a, b) => {
                                            const nameA = a.description.toLowerCase(),
                                                nameB = b.description.toLowerCase();
                                            if (nameA < nameB) return -1;
                                            if (nameA > nameB) return 1;

                                            return 0;
                                        })
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
                    <div className={`Fieldset ${advanced ? null : 'hidden'}`}>
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
                    <div className={`Fieldset ${advanced ? null : 'hidden'}`}>
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
                    {vast ? (
                        <div className={`Fieldset ${advanced ? null : 'hidden'}`}>
                            <h2 className="Fieldset__header">Op welke dagen kom je normaal gesproken?</h2>

                            {weekDays.map(day => (
                                <p key={day} className="InputField InputField--checkbox">
                                    <input
                                        id={`day${day}`}
                                        type="checkbox"
                                        name={dayKey[day]}
                                        defaultChecked={voorkeur[dayKey[day]]}
                                        defaultValue={day}
                                    />
                                    <label htmlFor={`day${day}`}>
                                        Ik kom elke <strong>{formatISODayOfWeek(day)}</strong>
                                    </label>
                                </p>
                            ))}
                        </div>
                    ) : null}

                    {vast ? (
                        <div className={`Fieldset ${advanced ? null : 'hidden'}`}>
                            <h2 className="Fieldset__header">Langdurige afwezigheid</h2>
                            <p className="InputField InputField--checkbox">
                                <input
                                    id="inactive"
                                    type="checkbox"
                                    name="inactive"
                                    defaultChecked={voorkeur.inactive}
                                />
                                <label htmlFor="inactive">Ik kan voorlopig niet op de markt aanwezig zijn.</label>
                            </p>
                        </div>
                    ) : null}
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
            </form>
        );
    }
}
module.exports = AlgemeneVoorkeurenForm;

const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');
const { formatDayOfWeek } = require('../../util.js');

class AanmeldForm extends React.Component {
    propTypes = {
        date: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        aanmeldingen: PropTypes.array,
        markt: PropTypes.object,
        query: PropTypes.string,
    };

    render() {
        const { aanmeldingen, date, ondernemer, markt, query } = this.props;
        const rsvp = (aanmeldingen || []).find(a => a.marktDate === date);
        const marktId = rsvp ? rsvp.marktId : '';
        const checked = !!rsvp;
        const noMarkt = {
            id: '',
            naam: '',
        };
        const markten = [
            noMarkt,
            ...ondernemer.sollicitaties
                .filter(sollicitatie => !sollicitatie.doorgehaald)
                .map(sollicitatie => sollicitatie.markt),
        ].map(m => ({ ...m, selected: m.id === marktId }));
        const sollicitatie = ondernemer.sollicitaties.find(soll => {
            return markt.id === soll.markt.id;
        });

        return (
            <form className="Form" method="POST" action="/aanmelden/">
                <h1>
                    Aanmelden voor {ondernemer.voorletters && ondernemer.voorletters + ' '}
                    {ondernemer.achternaam}
                    {markt && ' voor de ' + markt.naam}
                </h1>
                <p>
                    Erkenningsnummer: <strong>{ondernemer.erkenningsnummer}</strong>
                </p>
                <section className="Fieldset">
                    {markt ? (
                        <input name="marktId" id="marktId" value={markt.id} type="hidden" />
                    ) : (
                        <p className="InputField">
                            <label htmlFor="marktId">Markt:</label>
                            <select name="marktId" id="marktId">
                                {markten.map(m => (
                                    <option key={m.id} value={`${m.id}`} selected={m.selected}>
                                        {m.naam}
                                    </option>
                                ))}
                            </select>
                        </p>
                    )}

                    <ul className="CheckboxList">
                        <li>
                            <span className="InputField InputField--checkbox InputField--afmelden">
                                <input
                                    className=""
                                    id="aanmelding[]"
                                    name="aanmelding"
                                    type="checkbox"
                                    defaultValue={date}
                                    defaultChecked={checked}
                                />
                                <label htmlFor="aanmelding[]">
                                    Ik kom morgen ({formatDayOfWeek(date)} {date})
                                </label>
                            </span>
                        </li>
                    </ul>
                    <p className="InputField InputField--submit">
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="next"
                            value={`/markt/${markt.id}/${date}/sollicitanten/#soll-${sollicitatie.sollicitatieNummer}`}
                        >
                            Opslaan en terug
                        </button>
                        <a
                            className="Button Button--tertiary"
                            href={`/markt/${markt.id}/${date}/sollicitanten/#soll-${sollicitatie.sollicitatieNummer}`}
                        >
                            Terug
                        </a>
                    </p>
                </section>
            </form>
        );
    }
}

module.exports = AanmeldForm;

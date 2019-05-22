const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');
const { formatDayOfWeek, MILLISECONDS_IN_DAY } = require('../../util.js');
const { getUpcomingMarktDays, parseMarktDag } = require('../../domain-knowledge.js');
const today = () => new Date().toISOString().replace(/T.+/, '');

class AfmeldForm extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        ondernemer: PropTypes.object.isRequired,
        markten: PropTypes.array,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
    };

    render() {
        const { markten, ondernemer } = this.props;
        const sollicitaties = ondernemer.sollicitaties.filter(sollicitatie => !sollicitatie.doorgehaald);

        let rsvpIndex = 0;

        const entries = sollicitaties.map(sollicitatie => {
            const markt = markten.find(m => m.id === sollicitatie.markt.id);
            const dates = getUpcomingMarktDays(
                this.props.startDate,
                this.props.endDate,
                (markt.marktDagen || []).map(parseMarktDag),
            );
            const marktAanmeldingen = (this.props.aanmeldingen || []).filter(
                aanmelding => aanmelding.marktId === sollicitatie.markt.id,
            );

            // TODO: Replace non-pure `rsvpIndex` with grouping by `markt.id` afterwards
            const rsvpEntries = dates.map(date => ({
                date,
                rsvp: marktAanmeldingen.find(aanmelding => aanmelding.marktDate === date),
                index: rsvpIndex++,
            }));

            return {
                sollicitatie,
                markt,
                dates,
                rsvpEntries,
                aanmeldingen: marktAanmeldingen,
            };
        });

        return (
            <form className="Form" method="POST" action="/afmelden/" encType="application/x-www-form-urlencoded">
                <h1>Afmelden voor {ondernemer.description}</h1>
                <p>
                    <label htmlFor="erkenningsNummer">Erkenningsnummer:</label>
                    <input id="erkenningsNummer" name="erkenningsNummer" defaultValue={ondernemer.erkenningsnummer} />
                </p>
                {entries.map(({ sollicitatie, markt, rsvpEntries }) => (
                    <section key={sollicitatie.markt.id}>
                        <h2>
                            {markt.naam} ({sollicitatie.status})
                        </h2>
                        <a
                            href={`/markt-indeling/${markt.id}/${today()}/indelingslijst/#soll-${
                                sollicitatie.sollicitatieNummer
                            }`}
                            className="Button"
                        >
                            Naar indelingslijst
                        </a>
                        <span>Aanvinken welke dagen je komt</span>
                        <ul className="CheckboxList">
                            {rsvpEntries.map(({ date, rsvp, index }) => (
                                <li key={date}>
                                    <input type="hidden" name={`rsvp[${index}][marktId]`} defaultValue={markt.id} />
                                    <input type="hidden" name={`rsvp[${index}][marktDate]`} defaultValue={date} />
                                    <span className="InputField InputField--checkbox InputField--afmelden">
                                        <input
                                            id={`rsvp-${index}`}
                                            name={`rsvp[${index}][attending]`}
                                            type="checkbox"
                                            defaultValue="true"
                                            defaultChecked={
                                                rsvp
                                                    ? rsvp.attending
                                                    : sollicitatie.status === 'vkk' || sollicitatie.status === 'vpl'
                                            }
                                        />
                                        <label htmlFor={`rsvp-${index}`}>
                                            Ik kom <strong>{formatDayOfWeek(date)}</strong>{' '}
                                            <span className="InputField--afmelden__date">{date}</span>
                                        </label>
                                        {rsvp ? <span className="rsvp-verified">🆗</span> : null}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
                <p className="InputField InputField--submit">
                    <input className="Input Input--submit-secondary" value="Versturen" type="submit" />
                    <input className="Input Input--submit-tertiary" value="Annuleren" type="button" />
                </p>
            </form>
        );
    }
}
module.exports = AfmeldForm;

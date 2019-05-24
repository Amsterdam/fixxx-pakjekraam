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
        currentMarktId: PropTypes.string,
    };

    render() {
        const { markten, ondernemer, currentMarktId } = this.props;
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
                {/* <input name="next" value={`/afmelden/${ondernemer.erkenningsnummer}/?updated=${new Date().toISOString()}`}/>*/}
                <h1>
                    Afmelden voor {ondernemer.voorletters && ondernemer.voorletters + ' '}
                    {ondernemer.achternaam}
                </h1>
                <p>
                    <label htmlFor="erkenningsNummer">Erkenningsnummer:</label>
                    <input id="erkenningsNummer" name="erkenningsNummer" defaultValue={ondernemer.erkenningsnummer} />
                </p>
                {(currentMarktId
                    ? entries.filter(({ markt }) => {
                          return String(markt.id) === currentMarktId;
                      })
                    : entries
                ).map(({ sollicitatie, markt, rsvpEntries }) => (
                    <section className="Fieldset" key={sollicitatie.markt.id}>
                        <div className="Fieldset__header">
                            <h2 className="Fieldset__title">
                                {markt.naam} ({sollicitatie.status}, {sollicitatie.sollicitatieNummer})
                            </h2>
                        </div>
                        <span className="Fieldset__subtitle">Aanvinken welke dagen je komt</span>
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
                                            <span className="InputField--afmelden__main">
                                                Ik kom <strong>{formatDayOfWeek(date)}</strong>
                                            </span>
                                            <span className="InputField--afmelden__date">{date}</span>
                                            {rsvp ? (
                                                <span
                                                    className="InputField--afmelden__rsvp-verified"
                                                    style={{ display: 'none' }}
                                                >
                                                    Bevestigd
                                                </span>
                                            ) : null}
                                        </label>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {currentMarktId && (
                            <p className="InputField InputField--submit">
                                <button
                                    className="Button Button--secondary"
                                    type="submit"
                                    name="next"
                                    value={`/afmelden/${ondernemer.erkenningsnummer}/${
                                        markt.id
                                    }/?updated=${new Date().toISOString()}`}
                                >
                                    Opslaan en verder
                                </button>
                                {currentMarktId && (
                                    <a
                                        className="Button Button--tertiary"
                                        href={`/markt/${markt.id}/${today()}/indelingslijst/#soll-${
                                            sollicitatie.sollicitatieNummer
                                        }`}
                                    >
                                        Terug
                                    </a>
                                )}
                            </p>
                        )}
                    </section>
                ))}
                {!currentMarktId && (
                    <p className="InputField InputField--submit">
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="next"
                            value={`/afmelden/${ondernemer.erkenningsnummer}/?updated=${new Date().toISOString()}`}
                        >
                            Opslaan en verder
                        </button>
                        {currentMarktId && (
                            <a
                                className="Button Button--tertiary"
                                href={`/markt/${markt.id}/${today()}/indelingslijst/`}
                            >
                                Annuleer
                            </a>
                        )}
                    </p>
                )}
            </form>
        );
    }
}
module.exports = AfmeldForm;

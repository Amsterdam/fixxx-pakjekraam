const OndernemerMarktHeading = require('./OndernemerMarktHeading');
const React = require('react');
const PropTypes = require('prop-types');
const { formatDayOfWeek, MILLISECONDS_IN_DAY } = require('../../util.js');
const { getMarktDays, parseMarktDag, filterRsvpList } = require('../../domain-knowledge.js');
const today = () => new Date().toISOString().replace(/T.+/, '');

class AfmeldForm extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        ondernemer: PropTypes.object.isRequired,
        markten: PropTypes.array,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
        currentMarktId: PropTypes.string,
        query: PropTypes.string,
    };

    render() {
        const { markten, ondernemer, currentMarktId, query } = this.props;
        const sollicitaties = ondernemer.sollicitaties.filter(sollicitatie => !sollicitatie.doorgehaald);

        const entries = sollicitaties.map(sollicitatie => {
            const markt = markten.find(m => m.id === sollicitatie.markt.id);
            const marktAanmeldingen = (this.props.aanmeldingen || []).filter(
                aanmelding => aanmelding.marktId === sollicitatie.markt.id,
            );

            return {
                sollicitatie,
                markt,
                rsvpEntries: filterRsvpList(marktAanmeldingen, markt),
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
                    Erkenningsnummer: <strong>{ondernemer.erkenningsnummer}</strong>
                </p>
                <input
                    id="erkenningsNummer"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                    type="hidden"
                />
                {(currentMarktId
                    ? entries.filter(({ markt }) => {
                          return String(markt.id) === currentMarktId;
                      })
                    : entries
                ).map(({ sollicitatie, markt, rsvpEntries }) => {
                    const next = query.next
                        ? query.next
                        : `/markt/${markt.id}/${query.datum}/${query.type}/#soll-${sollicitatie.sollicitatieNummer}`;
                    console.log(next);

                    return (
                        <section className="Fieldset" key={sollicitatie.markt.id}>
                            <div className="Fieldset__header">
                                <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
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
                                    <button className="Button Button--secondary" type="submit" name="next" value={next}>
                                        Opslaan en terug
                                    </button>
                                    {currentMarktId && (
                                        <a className="Button Button--tertiary" href={next}>
                                            Terug
                                        </a>
                                    )}
                                </p>
                            )}
                        </section>
                    );
                })}
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

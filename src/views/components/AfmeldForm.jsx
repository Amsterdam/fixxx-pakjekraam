const OndernemerMarktHeading = require('./OndernemerMarktHeading');
const React = require('react');
const PropTypes = require('prop-types');
const { formatDayOfWeek, WEEK_DAYS, today, formatDate } = require('../../util.js');
const { filterRsvpList, isVast } = require('../../domain-knowledge.js');

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
            <form className="Form" method="POST" action="./" encType="application/x-www-form-urlencoded">
                <h1>Aanwezigheid wijzigen</h1>
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
                    let lastDivider = false;
                    const next = query.next ? query.next : `/markt-detail/${markt.id}/#aanwezigheid`;

                    return (
                        <section className="Fieldset" key={sollicitatie.markt.id}>
                            <div className="Fieldset__header">
                                <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
                            </div>
                            {isVast(sollicitatie.status) ? (
                                <span className="Fieldset__subtitle">
                                    Vink uit op welke dagen u (of uw vervanger) niet op deze markt staat.
                                </span>
                            ) : (
                                <span className="Fieldset__subtitle">
                                    Vink aan op welke dagen u (of uw vervanger) naar de markt wilt komen.
                                </span>
                            )}
                            <ul className="CheckboxList">
                                {rsvpEntries.map(({ date, rsvp, index }, i) => (
                                    <li key={date}>
                                        {i === 0 ? (
                                            <span className="OndernemerMarktAanwezigheid__divider">deze week</span>
                                        ) : null}
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
                                                    <strong>{formatDayOfWeek(date)}</strong>
                                                </span>
                                                <span className="InputField--afmelden__date">{formatDate(date)}</span>
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
                                        {WEEK_DAYS[new Date(date).getDay()].slice(0, 2) ===
                                            markt.marktDagen[markt.marktDagen.length - 1] && !lastDivider ? (
                                            <span className="OndernemerMarktAanwezigheid__divider">
                                                volgende week
                                                {(lastDivider = true)}
                                            </span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                            {currentMarktId && (
                                <p className="InputField InputField--submit">
                                    <button
                                        className="Button Button--secondary"
                                        type="submit"
                                        name="next"
                                        value={`${next}?error=aanwezigheid-saved#aanwezigheid`}
                                    >
                                        Bewaren
                                    </button>
                                    {currentMarktId && (
                                        <a className="Button Button--tertiary" href={`${next}#aanwezigheid`}>
                                            Annuleer
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
                            value={`/afmelden/?updated=${new Date().toISOString()}`}
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

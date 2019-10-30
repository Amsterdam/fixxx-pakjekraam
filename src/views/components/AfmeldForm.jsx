const OndernemerMarktHeading = require('./OndernemerMarktHeading');
const React = require('react');
const PropTypes = require('prop-types');
const {
    formatDayOfWeek,
    addMinutes,
    WEEK_DAYS,
    MINUTES_IN_HOUR,
    today,
    formatDate,
    relativeHumanDay,
    endOfWeek,
    addDays,
} = require('../../util.ts');
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
        role: PropTypes.string,
    };

    render() {
        const { markten, ondernemer, currentMarktId, query, role, aanmeldingen } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(
            soll => !soll.doorgehaald && String(soll.markt.id) === currentMarktId,
        );
        const markt = markten.find(m => String(m.id) === currentMarktId);
        const OFFSET = 4; // from 24:00 to 21:00
        const now = addMinutes(new Date(), MINUTES_IN_HOUR * OFFSET);

        console.log(new Date());

        const rsvpEntries = filterRsvpList(
            aanmeldingen.filter(aanmelding => aanmelding.marktId === markt.id),
            markt,
            now,
            // role === 'marktmeester' ? now : addDays(now, 1),
        );


        const weekAanmeldingen = rsvpEntries.reduce(
            (t, { date, rsvp, index }, i) => {
                const week = new Date(date) > new Date(endOfWeek()) ? 1 : 0;
                const attending = rsvp
                    ? rsvp.attending
                    : sollicitatie.status === 'vkk' || sollicitatie.status === 'vpl';
                t[week].push({
                    index,
                    attending,
                    date,
                    weekDay: formatDayOfWeek(date),
                });

                return t;
            },
            [[], []],
        );

        return (
            <form
                className="Form"
                method="POST"
                data-decorator="aanwezigheid-form"
                action="./"
                encType="application/x-www-form-urlencoded"
            >
                <input
                    id="erkenningsNummer"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                    type="hidden"
                />
                <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
                {isVast(sollicitatie.status) ? (
                    <span className="Fieldset__subtitle">
                        Vink uit op welke dagen u (of uw vervanger) niet op deze markt staat.
                    </span>
                ) : (
                    <span className="Fieldset__subtitle">
                        Vink aan op welke dagen u (of uw vervanger) naar de markt wilt komen.
                    </span>
                )}
                {weekAanmeldingen.map((week, i) => (
                    <div key={i}>
                        <span className="OndernemerMarktAanwezigheid__divider">
                            {i === 0 ? 'Deze week' : 'Volgende week'}
                        </span>
                        <ul className="CheckboxList">
                            {week.map(({ date, attending, index, weekDay }) => (
                                <li key={date}>
                                    <input type="hidden" name={`rsvp[${index}][marktId]`} defaultValue={markt.id} />
                                    <input type="hidden" name={`rsvp[${index}][marktDate]`} defaultValue={date} />

                                    <span className="InputField InputField--checkbox InputField--afmelden">
                                        <input
                                            id={`rsvp-${index}`}
                                            name={`rsvp[${index}][attending]`}
                                            type="checkbox"
                                            defaultValue="true"
                                            defaultChecked={attending}
                                        />
                                        <label htmlFor={`rsvp-${index}`}>
                                            <span className="InputField--afmelden__main">
                                                <strong>{weekDay}</strong>
                                            </span>
                                            <span className="InputField--afmelden__date">{formatDate(date)}</span>
                                        </label>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <p className="InputField InputField--submit">
                    <button
                        className="Button Button--secondary"
                        type="submit"
                        name="next"
                        value={`${
                            role === 'marktmeester'
                                ? `/profile/${ondernemer.erkenningsnummer}?error=aanwezigheid-saved`
                                : `/markt-detail/${markt.id}?error=aanwezigheid-saved#aanwezigheid`
                        }`}
                    >
                        Bewaren
                    </button>
                    {currentMarktId && (
                        <a
                            className="Button Button--tertiary"
                            href={`${
                                role === 'marktmeester'
                                    ? `/profile/${ondernemer.erkenningsnummer}`
                                    : `/markt-detail/${markt.id}#aanwezigheid`
                            }`}
                        >
                            Annuleer
                        </a>
                    )}
                </p>
            </form>
        );
    }
}
module.exports = AfmeldForm;

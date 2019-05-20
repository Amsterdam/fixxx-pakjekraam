const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');
const { formatDayOfWeek, MILLISECONDS_IN_DAY } = require('../../util.js');
const { parseMarktDag } = require('../../domain-knowledge.js');

const toISODate = date => date.toISOString().replace(/T.+/, '');

const getUpcomingMarktDays = (startDate, endDate, daysOfWeek) => {
    const start = Date.parse(startDate),
        end = Date.parse(endDate);

    const days = Math.max(0, (end - start) / MILLISECONDS_IN_DAY);

    const dates = [];

    for (let i = 1, l = days; i <= l; i++) {
        const date = new Date(start);

        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    return dates.filter(date => daysOfWeek.includes(date.getDay())).map(toISODate);
};

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
            const rsvpEntries = dates.map(date => ({
                date,
                rsvp: marktAanmeldingen.find(aanmelding => aanmelding.marktDate === date),
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
            <form method="POST" action="/afmelden/">
                <h1>Afmelden door vasteplekhouders</h1>
                <input type="hidden" name="startDate" value={this.props.startDate} />
                <input type="hidden" name="endDate" value={this.props.endDate} />
                <p>
                    <label htmlFor="username">Erkenningsnummer:</label>
                    <input id="username" name="username" value={ondernemer.erkenningsnummer} />
                </p>
                {entries.map(({ sollicitatie, markt, rsvpEntries }) => (
                    <section key={sollicitatie.markt.id}>
                        <h2>
                            {markt.naam} ({sollicitatie.status})
                        </h2>
                        <ul>
                            {rsvpEntries.map(({ date, rsvp }) => (
                                <li key={date}>
                                    <input
                                        id={`aanmelding-${markt.id}-${date}`}
                                        name={`aanmelding[]`}
                                        type="checkbox"
                                        value={`${markt.id}/${date}`}
                                        defaultChecked={
                                            sollicitatie.status === 'vkk' ||
                                            sollicitatie.status === 'vpl' ||
                                            (rsvp && rsvp.attending)
                                        }
                                    />
                                    <label htmlFor={`aanmelding-${markt.id}-${date}`}>
                                        Ik kom op {formatDayOfWeek(date)} {date}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
                <p>
                    <input type="submit" />
                </p>
            </form>
        );
    }
}

module.exports = AfmeldForm;

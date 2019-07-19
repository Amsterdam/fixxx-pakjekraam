const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('./components/EmailContent.jsx');
const EmailTable = require('./components/EmailTable.jsx');
const EmailBase = require('./components/EmailBase.jsx');
const { formatDate, relativeHumanDay, WEEK_DAYS, formatDayOfWeek, endOfWeek } = require('../util.ts');
const { isVast, formatOndernemerName } = require('../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailWijzigingAanmeldingen extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        aanmeldingen: PropTypes.object.isRequired,
    };

    render() {
        const { markt, marktDate, ondernemer, aanmeldingen } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
        const weekAanmeldingen = aanmeldingen.reduce(
            (t, { date, rsvp, index }, i) => {
                const attending = rsvp
                    ? rsvp.attending
                    : sollicitatie.status === 'vkk' || sollicitatie.status === 'vpl';
                t[t.length - 1].push([
                    <span key={date}>
                        <strong>{relativeHumanDay(date)}</strong> {formatDayOfWeek(date)}
                    </span>,
                    formatDate(date),
                    <strong key={attending ? `aangemeld` : `afgemeld`}>{attending ? `aangemeld` : `afgemeld`}</strong>,
                ]);
                new Date(date) >= new Date(endOfWeek()) && t.length === 1 && t.push([]);

                return t;
            },
            [[]],
        );

        return (
            <EmailBase
                lang="nl"
                appName={`Kies je kraam`}
                domain={`kiesjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.naam} ${formatDate(marktDate)}`}
            >
                <EmailContent>
                    <p>Beste {formatOndernemerName(ondernemer)},</p>

                    <p>Je hebt je aanmeldingen voor de markt {markt.naam} gewijzigd.</p>

                    <p>
                        Wil u zich voor een dag aan- of afmelden? Dan kan dat uiterlijk 21:00 uur de dag ervoor in
                        <a href="https://pakjekraam.amsterdam.nl">&apos;kies je kraam&apos;</a>.
                    </p>

                    <EmailContent>
                        <p>Uw aan- en afmeldingen voor de {markt.naam}:</p>
                        {weekAanmeldingen.map((week, i) => (
                            <EmailTable key={i} data={week} title={i === 0 ? `Deze week` : `Volgende week`} />
                        ))}
                    </EmailContent>

                    <p>
                        Met vriendelijke groet,
                        <br />
                        Marktbureau Amsterdam
                    </p>
                </EmailContent>
            </EmailBase>
        );
    }
}

module.exports = EmailWijzigingAanmeldingen;

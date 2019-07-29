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
        eggie: PropTypes.bool,
    };

    render() {
        const { markt, marktDate, ondernemer, aanmeldingen, eggie } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
        const weekAanmeldingen = aanmeldingen.reduce(
            (t, { date, rsvp, index }, i) => {
                const week = new Date(date) > new Date(endOfWeek()) ? 1 : 0;
                const attending = rsvp
                    ? rsvp.attending
                    : sollicitatie.status === 'vkk' || sollicitatie.status === 'vpl';
                t[week].push([
                    <span key={date}>
                        <strong>{relativeHumanDay(date)}</strong> {formatDayOfWeek(date)}
                    </span>,
                    formatDate(date),
                    <strong key={attending ? `aangemeld` : `afgemeld`}>{attending ? `aangemeld` : `afgemeld`}</strong>,
                ]);

                return t;
            },
            [[], []],
        );

        return (
            <EmailBase
                lang="nl"
                appName={`Kies je kraam`}
                domain={`kiesjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.naam} ${formatDate(marktDate)}`}
            >
                {!eggie ? (
                    <EmailContent>
                        <p>Beste {formatOndernemerName(ondernemer)},</p>
                        <p>
                            Dit is een testmail tijdens de wenperiode van digitaal indelen. U ontvangt deze e-mail omdat
                            u uw aanmeldingen voor de markt Plein &apos;40 - &apos;45 hebt gewijzigd.
                        </p>
                        <p>
                            Het aan- en afmelden verloopt zoals u gewend bent.
                            <br />
                            Tijdens de wenperiode gelden geen andere regels.
                        </p>

                        <p>
                            <strong>Meer informatie?</strong>
                            <br />
                            Op deze{' '}
                            <a href="https://www.amsterdam.nl/ondernemen/markt-straathandel/digitaal-indelen-plein-40-45/">
                                website
                            </a>{' '}
                            kunt u veel informatie vinden over digitaal indelen. Wij raden u aan dit te lezen als u wilt
                            weten hoe het precies werkt.
                        </p>
                        <p>
                            Hebt u daarna nog vragen? Stuur ons dan een e-mail via{' '}
                            <a href="mailto: marktbureau@amsterdam.nl">marktbureau@amsterdam.nl</a> of bel ons via 14
                            020.
                        </p>

                        <p>
                            Met vriendelijke groet,
                            <br />
                            Marktbureau Amsterdam
                        </p>
                    </EmailContent>
                ) : (
                    <EmailContent>
                        <p>Beste {formatOndernemerName(ondernemer)},</p>

                        <p>Je hebt je aanmeldingen voor de markt {markt.naam} gewijzigd.</p>

                        <p>
                            Wil u zich voor een dag aan- of afmelden? Dan kan dat uiterlijk 21:00 uur de dag ervoor in
                            {` `}
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
                )}
            </EmailBase>
        );
    }
}

module.exports = EmailWijzigingAanmeldingen;

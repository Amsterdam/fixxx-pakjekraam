const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('./components/EmailContent.jsx');
const EmailBase = require('./components/EmailBase.jsx');
const EmailTable = require('./components/EmailTable.jsx');
const { formatDate, relativeHumanDay, WEEK_DAYS, formatDayOfWeek, endOfWeek } = require('../util.ts');
const { isVast, formatOndernemerName } = require('../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailWijzigingVoorkeuren extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        voorkeuren: PropTypes.array,
        eggie: PropTypes.bool,
    };

    render() {
        const { markt, marktDate, ondernemer, voorkeuren, eggie } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);

        return (
            <EmailBase
                lang="nl"
                appName={`Kies je kraam`}
                domain={`pakjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.naam} ${formatDate(marktDate)}`}
            >
                {!eggie ? (
                    <EmailContent>
                        <p>Beste {formatOndernemerName(ondernemer)},</p>
                        <p>Dit is een testmail tijdens de wenperiode van digitaal indelen.</p>
                        <p>U heeft uw plaatsvoorkeuren gewijzigd.</p>

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
                        {voorkeuren.length ? (
                            <EmailContent>
                                <p>Uw nieuwe plaatsvoorkeurenlijst ziet er volgt uit.</p>
                                <ul>
                                    {voorkeuren.map((voorkeurSet, i) => (
                                        <li key={i}>
                                            <span>
                                                {i + 1}e keuze: <strong>{voorkeurSet.join(' en ')}</strong>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </EmailContent>
                        ) : (
                            <EmailContent>
                                <p>
                                    <strong>Uw heeft al uw plaatsvoorkeuren verwijderd!</strong>
                                </p>
                            </EmailContent>
                        )}
                        {isVast(sollicitatie.status) ? (
                            <EmailContent>
                                <p>
                                    <strong>
                                        Uw vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null} zijn:{' '}
                                        {sollicitatie.vastePlaatsen.join(', ')}
                                    </strong>
                                </p>
                            </EmailContent>
                        ) : null}

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

module.exports = EmailWijzigingVoorkeuren;

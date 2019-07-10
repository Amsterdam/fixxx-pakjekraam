const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('./components/EmailContent.jsx');
const EmailBase = require('./components/EmailBase.jsx');
const EmailTable = require('./components/EmailTable.jsx');
const { formatDate, relativeHumanDay, WEEK_DAYS, formatDayOfWeek, endOfWeek } = require('../util.js');
const { isVast, formatOndernemerName } = require('../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailWijzigingVoorkeuren extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        voorkeuren: PropTypes.array,
    };

    render() {
        const { markt, marktDate, ondernemer, voorkeuren } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);

        return (
            <EmailBase
                lang="nl"
                appName={`Pak je kraam`}
                domain={`pakjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.naam} ${formatDate(marktDate)}`}
            >
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
            </EmailBase>
        );
    }
}

module.exports = EmailWijzigingVoorkeuren;

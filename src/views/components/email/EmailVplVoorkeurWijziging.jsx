const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const { formatDate } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailVplVoorkeurWijziging extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
        voorkeuren: PropTypes.object,
    };

    render() {
        const { markt, marktDate, ondernemer, toewijzing, afwijzing, inschrijving, voorkeuren } = this.props;
        return (
            <EmailContent>
                <h2>Plaatsvoorkeur wijziging voor {markt.markt.naam}</h2>
                <p>Beste {ondernemer.description},</p>
                {voorkeuren.length ? (
                    <EmailContent>
                        <p>Uw nieuwe plaatsvoorkeurenlijst ziet er volgt uit.</p>
                        <ul>
                            {voorkeuren.map((voorkeurSet, i) => (
                                <li key={i}>
                                    {i + 1}e keuze: {voorkeurSet.join(' en ')}
                                </li>
                            ))}
                        </ul>
                    </EmailContent>
                ) : (
                    <EmailContent>
                        <p>
                            <strong>U heeft al uw plaatsvoorkeuren verwijderd!</strong>
                        </p>
                    </EmailContent>
                )}
                <EmailContent>
                    <p>
                        <strong>
                            U vaste plaats{ondernemer.plaatsen.length > 1 ? 'en' : null} zijn:{' '}
                            {ondernemer.plaatsen.join(', ')}
                        </strong>
                    </p>
                </EmailContent>

                <p>
                    Met vriendelijke groet,
                    <br />
                    Marktbureau Amsterdam
                </p>
            </EmailContent>
        );
    }
}

module.exports = EmailVplVoorkeurWijziging;

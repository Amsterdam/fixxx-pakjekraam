const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const { formatDate } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailSollRandomPlaatsConfirm extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
    };

    render() {
        const { markt, marktDate, ondernemer, toewijzing, afwijzing, inschrijving } = this.props;
        console.log(toewijzing);
        return (
            <EmailContent>
                <h2>Plaats nr. op de markt {markt.markt.naam} voor morgen</h2>
                <p>Beste {ondernemer.description},</p>

                <p>
                    Goed nieuws, u kunt morgen terecht op de markt {markt.markt.naam}.
                    <br />U kunt staan op plek: <strong>42</strong>(fixme: geen echte data)
                </p>

                <p>
                    Met vriendelijke groet,
                    <br />
                    Marktbureau Amsterdam
                </p>
            </EmailContent>
        );
    }
}

module.exports = EmailSollRandomPlaatsConfirm;

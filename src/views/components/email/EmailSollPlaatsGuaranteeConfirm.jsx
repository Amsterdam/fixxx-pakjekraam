const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const { formatDate } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailSollPlaatsGuaranteeConfirm extends React.Component {
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

        return (
            <EmailContent>
                <h2>Wel plek maar plaats onbekent op {markt.markt.naam} voor morgen</h2>
                <p>Beste {ondernemer.description},</p>

                <p>U heeft plaatsvoorkeuren opgegeven die we helaas niet hebben kunnen reserveren.</p>
                <p>
                    Het goede nieuws is, dat u morgen wel terecht kunt op de markt {markt.markt.naam}.<br />
                    De plaats krijgt u tijdens de loting toegewezen.
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

module.exports = EmailSollPlaatsGuaranteeConfirm;

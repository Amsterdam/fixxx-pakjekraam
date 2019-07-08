const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const { formatDate, formatDayOfWeek } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailSollNoPlaatsConfirm extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktplaatsen: PropTypes.array,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
        voorkeuren: PropTypes.array,
    };

    render() {
        const { markt, marktDate, ondernemer, toewijzing, afwijzing, inschrijving } = this.props;

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>

                <p>
                    Er is morgen ({formatDayOfWeek(marktDate)} {formatDate(marktDate)}) helaas GEEN plaats op de markt{' '}
                    {markt.naam} voor u.
                    <br />
                    De markt is vol.
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

module.exports = EmailSollNoPlaatsConfirm;

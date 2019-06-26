const PropTypes = require('prop-types');
const React = require('react');
const EmailBase = require('./components/EmailBase.jsx');
const EmailContent = require('./components/EmailContent.jsx');
const { formatDate } = require('../util.js');
const { isVast } = require('../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailSollVoorkeurConfirm extends React.Component {
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
            <EmailBase
                lang="nl"
                appName={`Pak je kraam`}
                domain={`pakjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.markt.naam} ${formatDate(marktDate)}`}
            >
                <EmailContent>
                    <h2>
                        Indeling {markt.markt.naam} {formatDate(marktDate)}
                    </h2>
                    <p>Beste {ondernemer.description},</p>

                    <p>U heeft plaatsvoorkeuren opgegeven die we helaas niet hebben kunnen reserveren.</p>
                    <p>
                        Het goed nieuws is, dat u morgen wel terecht kunt op de markt {markt.markt.naam}.<br />
                        De plaats krijgt u tijdens de loting toegewezen.
                    </p>

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

module.exports = EmailSollVoorkeurConfirm;

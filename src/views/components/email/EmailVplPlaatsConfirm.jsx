const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const { formatDate } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailVplPlaatsConfirm extends React.Component {
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
                <h2>
                    Indeling {markt.markt.naam} {formatDate(marktDate)}
                </h2>
                <p>Beste {ondernemer.description},</p>
                {inschrijving && inschrijving.attending ? (
                    <p>U heeft zich ingeschreven voor de markt vandaag.</p>
                ) : isVast(ondernemer.status) ? (
                    <p>U bent (tijdelijke) vasteplaatshouder op deze markt.</p>
                ) : (
                    <p>U heeft zich niet ingeschreven voor de markt van {formatDate(marktDate)}.</p>
                )}
                {afwijzing ? <p>U bent niet ingedeeld</p> : null}
                {!toewijzing ? (
                    markt.openPlaatsen.length > 0 ? (
                        <p>
                            Er zijn nog losse marktplaatsen, u maakt bij aanvang van de markt mogelijk nog kans op een
                            marktplaats.
                        </p>
                    ) : (
                        <p>Alle marktplaatsen zijn vergeven.</p>
                    )
                ) : null}
                {toewijzing ? (
                    <p>U bent ingedeeld voor de markt. Uw plaats(en): {formatPlaatsen(toewijzing.plaatsen)}</p>
                ) : null}
                <p>
                    Met vriendelijke groet,
                    <br />
                    Marktbureau Amsterdam
                </p>
            </EmailContent>
        );
    }
}

module.exports = EmailVplPlaatsConfirm;

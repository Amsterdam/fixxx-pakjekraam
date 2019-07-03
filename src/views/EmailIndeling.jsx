const PropTypes = require('prop-types');
const React = require('react');
const EmailBase = require('./components/EmailBase.jsx');
const EmailContent = require('./components/EmailContent.jsx');
const { formatDate } = require('../util.js');
const { isVast } = require('../domain-knowledge.js');

const EmailVplVoorkeurConfirm = require('./components/email/EmailVplVoorkeurConfirm.jsx');
const EmailSollNoPlaatsConfirm = require('./components/email/EmailSollNoPlaatsConfirm.jsx');
const EmailSollPlaatsConfirm = require('./components/email/EmailSollPlaatsConfirm.jsx');
const EmailSollRandomPlaatsConfirm = require('./components/email/EmailSollRandomPlaatsConfirm.jsx');
const EmailSollVoorkeurConfirm = require('./components/email/EmailSollVoorkeurConfirm.jsx');
const EmailVplPlaatsConfirm = require('./components/email/EmailVplPlaatsConfirm.jsx');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class IndelingMail extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
        voorkeuren: PropTypes.object,
        aanmeldingen: PropTypes.object,
        template: PropTypes.object,
    };

    render() {
        const {
            markt,
            marktDate,
            ondernemer,
            toewijzing,
            afwijzing,
            inschrijving,
            voorkeuren,
            template,
            aanmeldingen,
        } = this.props;
        const templProps = {
            markt,
            marktDate,
            ondernemer,
            toewijzing,
            afwijzing,
            inschrijving,
            voorkeuren,
            aanmeldingen,
        };

        const templates = {
            EmailVplVoorkeurConfirm,
            EmailSollNoPlaatsConfirm,
            EmailSollPlaatsConfirm,
            EmailSollRandomPlaatsConfirm,
            EmailSollVoorkeurConfirm,
            EmailVplPlaatsConfirm,
        };
        const Template = templates[template];

        return (
            <EmailBase
                lang="nl"
                appName={`Pak je kraam`}
                domain={`pakjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.naam} ${formatDate(marktDate)}`}
            >
                {template ? (
                    <Template {...templProps} />
                ) : (
                    <EmailContent>
                        {/* <h2>*/}
                        {/* Indeling {markt.markt.naam} {formatDate(marktDate)}*/}
                        {/* </h2>*/}
                        {/* <p>Beste {ondernemer.description},</p>*/}
                        {/* {inschrijving && inschrijving.attending ? (*/}
                        {/* <p>U heeft zich ingeschreven voor de markt vandaag.</p>*/}
                        {/* ) : isVast(ondernemer.status) ? (*/}
                        {/* <p>U bent (tijdelijke) vasteplaatshouder op deze markt.</p>*/}
                        {/* ) : (*/}
                        {/* <p>U heeft zich niet ingeschreven voor de markt van {formatDate(marktDate)}.</p>*/}
                        {/* )}*/}
                        {/* {afwijzing ? <p>U bent niet ingedeeld</p> : null}*/}
                        {/* {!toewijzing ? (*/}
                        {/* markt.openPlaatsen.length > 0 ? (*/}
                        {/* <p>*/}
                        {/* Er zijn nog losse marktplaatsen, u maakt bij aanvang van de markt mogelijk nog kans*/}
                        {/* op een marktplaats.*/}
                        {/* </p>*/}
                        {/* ) : (*/}
                        {/* <p>Alle marktplaatsen zijn vergeven.</p>*/}
                        {/* )*/}
                        {/* ) : null}*/}
                        {/* {toewijzing ? (*/}
                        {/* <p>U bent ingedeeld voor de markt. Uw plaats(en): {formatPlaatsen(toewijzing.plaatsen)}</p>*/}
                        {/* ) : null}*/}
                        {/* <p>*/}
                        {/* Met vriendelijke groet,*/}
                        {/* <br />*/}
                        {/* Marktbureau Amsterdam*/}
                        {/* </p>*/}
                    </EmailContent>
                )}
            </EmailBase>
        );
    }
}

module.exports = IndelingMail;

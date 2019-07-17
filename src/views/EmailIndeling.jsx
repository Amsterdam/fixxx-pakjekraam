const PropTypes = require('prop-types');
const React = require('react');
const EmailBase = require('./components/EmailBase.jsx');
const EmailContent = require('./components/EmailContent.jsx');
const { formatDate } = require('../util.ts');
const { isVast } = require('../domain-knowledge.js');

const { EmailVplVoorkeurConfirm } = require('./components/email/EmailVplVoorkeurConfirm.tsx');
const EmailSollNoPlaatsConfirm = require('./components/email/EmailSollNoPlaatsConfirm.jsx');
const EmailSollPlaatsConfirm = require('./components/email/EmailSollPlaatsConfirm.jsx');
const EmailSollRandomPlaatsConfirm = require('./components/email/EmailSollRandomPlaatsConfirm.jsx');
const EmailSollVoorkeurConfirm = require('./components/email/EmailSollVoorkeurConfirm.jsx');
const EmailVplPlaatsConfirm = require('./components/email/EmailVplPlaatsConfirm.jsx');
const EmailVplDefault = require('./components/email/EmailVplDefault.jsx');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailIndeling extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
        voorkeuren: PropTypes.object,
        aanmeldingen: PropTypes.object,
        subject: PropTypes.string,
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
            aanmeldingen,
            subject,
        } = this.props;

        let template;

        if (isVast(ondernemer.status)) {
            template = <EmailVplDefault {...this.props} />;
            if (!voorkeuren.length) {
                template = <EmailVplPlaatsConfirm {...this.props} />;
            } else {
                template = <EmailVplVoorkeurConfirm {...this.props} />;
            }
        } else {
            template = <EmailSollNoPlaatsConfirm {...this.props} />;
            if (!afwijzing && !toewijzing) {
                template = <EmailSollPlaatsConfirm {...this.props} />;
            } else if (voorkeuren.length && !afwijzing && toewijzing) {
                template = <EmailSollVoorkeurConfirm {...this.props} />;
            }
        }

        return (
            <EmailBase lang="nl" appName={`Pak je kraam`} domain={`pakjekraam.amsterdam.nl`} subject={subject}>
                {template ? (
                    template
                ) : (
                    <EmailContent>
                        {/* <h2>*/}
                        {/* Indeling {markt.naam} {formatDate(marktDate)}*/}
                        {/* </h2>*/}
                        {/* <p>Beste {ondernemer.description},</p>*/}
                        {/* {inschrijving && inschrijving.attending ? (*/}
                        {/* <p>U hebt zich ingeschreven voor de markt vandaag.</p>*/}
                        {/* ) : isVast(ondernemer.status) ? (*/}
                        {/* <p>U bent (tijdelijke) vasteplaatshouder op deze markt.</p>*/}
                        {/* ) : (*/}
                        {/* <p>U hebt zich niet ingeschreven voor de markt van {formatDate(marktDate)}.</p>*/}
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

module.exports = EmailIndeling;

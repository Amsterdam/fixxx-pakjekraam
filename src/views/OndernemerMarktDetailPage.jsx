const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const Content = require('./components/Content');
const OndernemerAanwezigheid = require('./components/OndernemerAanwezigheid');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');
const OndernemerMarktHeading = require('./components/OndernemerMarktHeading');
const OndernemerMarktVoorkeuren = require('./components/OndernemerMarktVoorkeuren');
const OndernemerMarktAanwezigheid = require('./components/OndernemerMarktAanwezigheid');
const OndernemerMarktAlgVoorkeuren = require('./components/OndernemerMarktAlgVoorkeuren');
const { today, tomorrow, yesterday } = require('../util.ts');
const Button = require('./components/Button');
const Alert = require('./components/Alert');
const AlertLine = require('./components/AlertLine');
const Uitslag = require('./components/Uitslag');
const { getMarktDays, parseMarktDag, filterRsvpList } = require('../domain-knowledge.js');

class OndernemerMarktDetailPage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
        plaatsvoorkeuren: PropTypes.array.isRequired,
        aanmeldingen: PropTypes.array.isRequired,
        markt: PropTypes.object.isRequired,
        marktId: PropTypes.string.isRequired,
        voorkeur: PropTypes.object.isRequired,
        branches: PropTypes.object.isRequired,
        messages: PropTypes.array,
        toewijzingen: PropTypes.array,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
        user: PropTypes.object,
        eggie: PropTypes.boolean,
    };

    render() {
        const {
            ondernemer,
            plaatsvoorkeuren,
            aanmeldingen,
            messages,
            markt,
            marktId,
            voorkeur,
            branches,
            toewijzingen,
            eggie,
        } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);

        const rsvpEntries = filterRsvpList(
            aanmeldingen.filter(aanmelding => aanmelding.marktId === markt.id),
            markt,
            today(),
        );

        const dateOfTomorrow = tomorrow();
        const toewijzingTomorrow = toewijzingen.find(toewijzing => {
            return toewijzing.marktDate == dateOfTomorrow;
        });

        const aanmeldingVandaag = aanmeldingen.find(aanmelding => aanmelding.marktDate == today());
        const aanmeldingMorgen = aanmeldingen.find(aanmelding => aanmelding.marktDate == tomorrow());
        const toewijzingVandaag = toewijzingen.find(aanmelding => aanmelding.marktDate == today());
        const toewijzingMorgen = toewijzingen.find(aanmelding => aanmelding.marktDate == tomorrow());
        const time = new Date();

        return (
            <Page messages={messages}>
                <Header user={ondernemer} logoUrl="../../dashboard/">
                    <a className="Header__nav-item" href="../../dashboard/">
                        Mijn markten
                    </a>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                <Content>
                    <p>Vanaf donderdag 1 augustus start de eerste fase van digitaal indelen.</p>
                    <p>
                        <strong>Let op:</strong> Ondernemers die zich digitaal hebben aangemeld, krijgen tijdens de
                        loting op de markt voorrang op ondernemers die zich niet digitaal hebben aangemeld.
                    </p>
                    <p>De loting en de indeling verloopt verder zoals u gewend bent.</p>
                    <OndernemerMarktHeading sollicitatie={sollicitatie} markt={markt} />
                    {!voorkeur || !voorkeur.brancheId ? (
                        <Alert type="warning" inline={true}>
                            <span>
                                U hebt uw <strong>koopwaar</strong> nog niet doorgegeven in het{' '}
                                <a href={`/algemene-voorkeuren/${markt.id}/`}>marktprofiel</a>.
                            </span>
                        </Alert>
                    ) : null}

                    <Uitslag time={new Date()} eggie={eggie} toewijzingVandaag={toewijzingVandaag} toewijzingMorgen={toewijzingMorgen} aanmeldingVandaag={aanmeldingVandaag} aanmeldingMorgen={aanmeldingMorgen}/>

                    <div className="row row--responsive">
                        <div className="col-1-2">
                            <OndernemerMarktAanwezigheid
                                markt={markt}
                                ondernemer={ondernemer}
                                sollicitatie={sollicitatie}
                                toewijzingen={toewijzingen}
                                rsvpEntries={rsvpEntries}
                            />
                        </div>
                        <div className="col-1-2">
                            <OndernemerMarktAlgVoorkeuren
                                sollicitatie={sollicitatie}
                                ondernemer={ondernemer}
                                markt={markt}
                                voorkeur={voorkeur}
                                branches={branches}
                            />
                            <OndernemerMarktVoorkeuren
                                ondernemer={ondernemer}
                                markt={markt}
                                plaatsvoorkeuren={plaatsvoorkeuren}
                                voorkeur={voorkeur}
                                sollicitatie={sollicitatie}
                            />
                        </div>
                    </div>
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerMarktDetailPage;

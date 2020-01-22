const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PlaatsvoorkeurenForm = require('./components/PlaatsvoorkeurenForm.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');
const SollicitatieSpecs = require('./components/SollicitatieSpecs');

const { getBreadcrumbsMarkt, getBreadcrumbsOndernemer } = require('../util');

class VoorkeurenPage extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        markten: PropTypes.array.isRequired,
        ondernemer: PropTypes.object.isRequired,
        marktPaginas: PropTypes.object,
        marktplaatsen: PropTypes.object,
        indelingVoorkeur: PropTypes.object,
        marktDate: PropTypes.string,
        messages: PropTypes.array,
        query: PropTypes.string,
        role: PropTypes.object,
        markt: PropTypes.object,
        sollicitatie: PropTypes.object,
        mededeling: PropTypes.object,
        csrfToken: PropTypes.string,
        user: PropTypes.object.isRequired
    };

    render() {
        const {
            marktplaatsen,
            indelingVoorkeur,
            role,
            plaatsvoorkeuren,
            ondernemer,
            markt,
            sollicitatie,
            mededeling,
            csrfToken,
            user
        } = this.props;

        const breadcrumbs = role === 'marktondernemer' ? getBreadcrumbsMarkt(markt, role) : getBreadcrumbsOndernemer(ondernemer, role);

        console.log(plaatsvoorkeuren);

        return (
            <Page messages={this.props.messages}>
                <Header
                    user={user}
                    role={role}
                    breadcrumbs={breadcrumbs}
                    >
                    { role === 'marktondernemer' ?
                        <OndernemerProfileHeader user={this.props.ondernemer} /> : null
                    }
                </Header>
                <Content>
                    { role === 'marktmeester' ?
                        <h2 className="Heading Heading--intro">Ondernemer</h2> : null
                    }
                    { role === 'marktmeester' ?
                        <OndernemerProfileHeader inline={true} user={ondernemer} /> : null
                    }
                    <SollicitatieSpecs sollicitatie={sollicitatie} />
                    <h1 className="Heading Heading--intro">Plaatsvoorkeuren {markt.naam}</h1>
                    <p>U kunt de plaatsvoorkeuren voor morgen tot 21.00 uur wijzigen.<br />
                        Wijzigt u de plaatsvoorkeuren na 21.00 uur? Dan gelden de wijzigingen voor de dagen na morgen.
                    </p>
                    { markt.kiesJeKraamFase ? (
                        <p dangerouslySetInnerHTML={{ __html: mededeling[markt.kiesJeKraamFase] }} />
                    ) : null}
                    <PlaatsvoorkeurenForm
                        plaatsvoorkeuren={plaatsvoorkeuren}
                        ondernemer={this.props.ondernemer}
                        markt={this.props.markten[0]}
                        indelingVoorkeur={indelingVoorkeur}
                        role={role}
                        marktplaatsen={marktplaatsen}
                        sollicitatie={sollicitatie}
                        csrfToken={csrfToken}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = VoorkeurenPage;

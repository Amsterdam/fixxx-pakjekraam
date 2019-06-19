const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const Content = require('./components/Content');
const OndernemerAanwezigheid = require('./components/OndernemerAanwezigheid');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');

class OndernemerDashboard extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        aanmeldingen: PropTypes.array,
        markten: PropTypes.array,
        plaatsvoorkeuren: PropTypes.array,
        messages: PropTypes.array,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
        user: PropTypes.object,
    };

    render() {
        const { ondernemer, messages, plaatsvoorkeuren, markten } = this.props;

        return (
            <Page messages={messages}>
                <Header user={ondernemer} logoUrl={`/dashboard/${ondernemer.erkenningsnummer}`}>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                <Content>
                    <a
                        href={`/algemene-voorkeuren/${ondernemer.erkenningsnummer}/?next=/dashboard/${
                            ondernemer.erkenningsnummer
                        }/`}
                        className="Button Button--secondary"
                    >
                        Profiel
                    </a>
                    <h1 className="h1">Mijn markten</h1>
                    <OndernemerAanwezigheid {...this.props} />
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerDashboard;

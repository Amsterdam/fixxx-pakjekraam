const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const Content = require('./components/Content');
const OndernemerAanwezigheid = require('./components/OndernemerAanwezigheid');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');
const OndernemerMarktTile = require('./components/OndernemerMarktTile');

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
        const { ondernemer, messages, plaatsvoorkeuren, markten, user } = this.props;
        const marktenEnabled = markten.filter(m => m.enabled);
        const sollicitaties = ondernemer.sollicitaties.filter(soll => {
            return !soll.doorgehaald && marktenEnabled.map(markt => markt.id).includes(soll.markt.id);
        });

        return (
            <Page messages={messages}>
                <Header user={ondernemer} logoUrl="/dashboard/">
                    <a className="Header__nav-item" href="./">
                        Mijn markten
                    </a>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                <Content>
                    <p style={{ color: 'red' }}>
                        <strong>Wenperiode!</strong>
                        <br />
                        Tijdens de wenperiode worden de &apos;Plaatsvoorkeuren&apos; niet gebruikt.
                    </p>
                    <h1 className="h1">Mijn markten</h1>
                    <div className="row row--responsive">
                        {sollicitaties.map(soll => (
                            <div key={soll.markt.id} className="col-1-2">
                                <OndernemerMarktTile markt={soll.markt} />
                            </div>
                        ))}
                    </div>
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerDashboard;

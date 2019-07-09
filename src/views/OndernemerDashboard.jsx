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
        const { ondernemer, messages, plaatsvoorkeuren, markten, user } = this.props;
        const marktenEnabled = markten.filter(m => m.properties.enabled);
        const sollicitaties = ondernemer.sollicitaties.filter(soll => {
            return !soll.doorgehaald && marktenEnabled.map(markt => markt.id).includes(soll.markt.id);
        });

        return (
            <Page messages={messages}>
                <Header user={ondernemer} logoUrl="/dashboard/">
                    <a className="Header__nav-item" href="/dashboard/">
                        Mijn markten
                    </a>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                <Content>
                    <h1 className="h1">Mijn markten</h1>
                    <ul className="LinkList">
                        {sollicitaties.map(soll => (
                            <li key={soll.markt.id} className="LinkList__item">
                                <a className="Link" href={`../markt-detail/${soll.markt.id}/`}>
                                    {soll.markt.naam}
                                </a>
                            </li>
                        ))}
                    </ul>
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerDashboard;

const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const MarktmeesterProfile = require('./components/MarktmeesterProfile.jsx');
const Header = require('./components/Header');

const { isVast } = require('../domain-knowledge.js');

const today = () => new Date().toISOString().replace(/T.+/, '');

class PublicProfilePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        user: PropTypes.object.isRequired,
        messages: PropTypes.array,
    };

    render(state) {
        const { ondernemer, user, messages } = this.props;
        const isVastSomewhere = ondernemer.sollicitaties.some(soll => isVast(soll.status));
        const isSollicitantSomewhere = ondernemer.sollicitaties.some(soll => soll.status === 'soll');

        return (
            <Page messages={messages}>
                <Header user={user} />
                <Content>
                    <OndernemerProfile ondernemer={ondernemer} />
                </Content>
            </Page>
        );
    }
}

module.exports = PublicProfilePage;

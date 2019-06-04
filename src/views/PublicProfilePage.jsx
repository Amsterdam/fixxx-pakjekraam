import Content from './components/Content';
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const MarktmeesterProfile = require('./components/MarktmeesterProfile.jsx');
import Header from './components/Header';

const { isVast } = require('../domain-knowledge.js');

const today = () => new Date().toISOString().replace(/T.+/, '');

class PublicProfilePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
    };

    render(state) {
        const { ondernemer } = this.props;
        const isVastSomewhere = ondernemer.sollicitaties.some(soll => isVast(soll.status));
        const isSollicitantSomewhere = ondernemer.sollicitaties.some(soll => soll.status === 'soll');

        return (
            <Page>
                <Header />
                <Content>
                    <OndernemerProfile ondernemer={ondernemer} />
                    {ondernemer.sollicitaties.length > 0 ? (
                        <p>
                            <a
                                href={`/voorkeuren/${ondernemer.erkenningsnummer}/?next=/profile/${
                                    ondernemer.erkenningsnummer
                                }`}
                            >
                                Voorkeuren voor alle markten
                            </a>
                        </p>
                    ) : null}
                </Content>
            </Page>
        );
    }
}

module.exports = PublicProfilePage;

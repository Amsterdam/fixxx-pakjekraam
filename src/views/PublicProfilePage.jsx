const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const MarktmeesterProfile = require('./components/MarktmeesterProfile.jsx');
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
                <OndernemerProfile ondernemer={ondernemer} />
                {/* TODO: Only show when the user has permissions to respond to someone elses RSVP */}
                {isVastSomewhere ? (
                    <p>
                        <a href={`/afmelden/${ondernemer.erkenningsnummer}/`}>Afmelding doorgeven</a>
                    </p>
                ) : null}
                {isSollicitantSomewhere ? (
                    <p>
                        <a href={`/aanmelden/${ondernemer.erkenningsnummer}/`}>Aanmelden als sollicitant</a>
                    </p>
                ) : null}
            </Page>
        );
    }
}

module.exports = PublicProfilePage;

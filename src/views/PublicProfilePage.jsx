const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const MarktmeesterProfile = require('./components/MarktmeesterProfile.jsx');

const today = () => new Date().toISOString().replace(/T.+/, '');

class PublicProfilePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
    };

    render(state) {
        return (
            <Page>
                <OndernemerProfile ondernemer={this.props.ondernemer} />
            </Page>
        );
    }
}

module.exports = PublicProfilePage;

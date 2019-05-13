const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const MarktmeesterProfile = require('./components/MarktmeesterProfile.jsx');

const today = () => new Date().toISOString().replace(/T.+/, '');

class ProfilePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        user: PropTypes.object.isRequired,
    };

    render(state) {
        return (
            <Page>
                {this.props.user.userType === 'ondernemer' ? (
                    <OndernemerProfile user={this.props.user} ondernemer={this.props.ondernemer} />
                ) : (
                    <MarktmeesterProfile user={this.props.user} />
                )}
                <p>
                    <a href="/logout">Uitloggen</a>
                </p>
            </Page>
        );
    }
}

module.exports = ProfilePage;

const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const Content = require('./components/Content');
const OndernemerAanwezigheid = require('./components/OndernemerAanwezigheid');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');
const Alert = require('./components/Alert');

class OndernemerDashboard extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        aanmeldingen: PropTypes.array,
        markten: PropTypes.array,
        startDate: PropTypes.string.isRequired,
        message: PropTypes.array,
        endDate: PropTypes.string.isRequired,
        user: PropTypes.object,
    };

    render() {
        const { ondernemer, user, markten, aanmeldingen, message, startDate, endDate } = this.props;

        return (
            <Page>
                <Header user={ondernemer} logoUrl={`/dashboard/${ondernemer.erkenningsnummer}`}>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                {!!message.length && <Alert type={`success`} message={message[0].message} />}
                <Content>
                    <h1 className="h1">Mijn markten</h1>
                    <OndernemerAanwezigheid {...this.props} />
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerDashboard;

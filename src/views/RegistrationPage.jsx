const Content = require('./components/Content');
const Header = require('./components/Header');
const RegistrationForm = require('./components/RegistrationForm.jsx');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const React = require('react');

class RegistrationPage extends React.Component {
    propTypes = {
        messages: PropTypes.array,
        username: PropTypes.string,
        email: PropTypes.string,
    };

    render() {
        return (
            <Page messages={this.props.messages}>
                <Header />
                <Content>
                    <h1 className="h1">Stel je wachtwoord in</h1>
                    <RegistrationForm username={this.props.username} email={this.props.email} />
                </Content>
            </Page>
        );
    }
}

module.exports = RegistrationPage;

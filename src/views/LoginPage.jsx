const Content = require('./components/Content');
const Header = require('./components/Header');
const LoginForm = require('./components/LoginForm.jsx');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const React = require('react');

class LoginPage extends React.Component {
    propTypes = {
        messages: PropTypes.array,
    };

    render() {
        return (
            <Page messages={this.props.messages}>
                <Header />
                <Content>
                    <h1 className="h1">Inloggen</h1>
                    <LoginForm />
                </Content>
            </Page>
        );
    }
}

module.exports = LoginPage;

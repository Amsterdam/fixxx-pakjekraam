const Content = require('./components/Content');
const Header = require('./components/Header');
const LoginForm = require('./components/LoginForm.jsx');
const Page = require('./components/Page.jsx');
const React = require('react');

class LoginPage extends React.Component {
    render() {
        return (
            <Page>
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

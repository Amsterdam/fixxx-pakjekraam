const React = require('react');
const Page = require('./components/Page.jsx');
const LoginForm = require('./components/LoginForm.jsx');

class LoginPage extends React.Component {
    render() {
        return (
            <Page>
                <LoginForm />
            </Page>
        );
    }
}

module.exports = LoginPage;

const React = require('react');
const Page = require('./Page.jsx');

class LoginForm extends React.Component {
    render() {
        return (
            <form method="POST" action="/login">
                <h1>Inloggen</h1>
                <p>
                    <label htmlFor="username">Gebruikersnaam:</label>
                    <input id="username" name="username" />
                </p>
                <p>
                    <label htmlFor="password">Wachtwoord:</label>
                    <input id="password" name="password" type="password" />
                </p>
                <p>
                    <input type="submit" />
                </p>
            </form>
        );
    }
}

module.exports = LoginForm;

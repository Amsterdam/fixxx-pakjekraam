const React = require('react');
const Page = require('./Page.jsx');

class LoginForm extends React.Component {
    render() {
        return (
            <form className="Form" method="POST" action="/login">
                <fieldset className="Fieldset">
                    <p className="InputField">
                        <label className="Label" htmlFor="username">
                            Gebruikersnaam:
                        </label>
                        <input className="Input Input--text" id="username" name="username" autoComplete="username" />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="password">
                            Wachtwoord:
                        </label>
                        <input
                            className="Input Input--password"
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                        />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit-primary" type="submit" value="Inloggen" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = LoginForm;

const React = require('react');
const Page = require('./Page.jsx');

import Alert from './Alert';

class LoginForm extends React.Component {
    render() {
        return (
            <form className="Form" method="POST" action="/login">
                <Alert message="Body alert message" title="Optional title" type="warning" />
                <fieldset className="Fieldset">
                    <p className="InputField">
                        <label className="Label" htmlFor="username">
                            Gebruikersnaam:
                        </label>
                        <input className="Input Input--text" id="username" name="username" />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="password">
                            Wachtwoord:
                        </label>
                        <input className="Input Input--password" id="password" name="password" type="password" />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit" type="submit" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = LoginForm;

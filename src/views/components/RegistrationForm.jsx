const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');

class RegistrationForm extends React.Component {
    propTypes = {
        username: PropTypes.string,
        email: PropTypes.string,
    };

    render() {
        return (
            <form className="Form" method="POST" action="/registreren">
                <fieldset className="Fieldset">
                    <p className="InputField" style={{ display: 'none' }}>
                        <label className="Label" htmlFor="password">
                            Gebruikersnaam:
                        </label>
                        <input
                            className="Input Input--text"
                            type="text"
                            name="username"
                            readOnly={true}
                            defaultValue={this.props.username}
                            autoComplete="username"
                        />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="password">
                            Bedenk je wachtwoord:
                        </label>
                        <input
                            className="Input Input--password"
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            minLength="8"
                            required="required"
                        />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="passwordRepeat">
                            Herhaal het wachtwoord:
                        </label>
                        <input
                            className="Input Input--password"
                            id="passwordRepeat"
                            name="passwordRepeat"
                            type="password"
                            autoComplete="new-password"
                            minLength="8"
                            required="required"
                        />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="email">
                            E-mail:
                        </label>
                        <input
                            className="Input Input--email"
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            defaultValue={this.props.email}
                        />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit-primary" type="submit" value="Opslaan" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = RegistrationForm;

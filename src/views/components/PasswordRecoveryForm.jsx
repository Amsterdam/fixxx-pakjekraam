const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');

class PasswordRecoveryForm extends React.Component {
    propTypes = {
        username: PropTypes.string,
    };

    render() {
        return (
            <form className="Form" method="POST" action="/herstellen">
                <fieldset className="Fieldset">
                    <p className="InputField">
                        <label className="Label" htmlFor="username">
                            Erkenningsnummer:
                        </label>
                        <input
                            className="Input Input--text"
                            id="username"
                            name="username"
                            autoComplete="username"
                            defaultValue={this.props.username}
                        />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit-primary" type="submit" value="Wachtwoord herstellen" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = PasswordRecoveryForm;

const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');

class ActivateForm extends React.Component {
    propTypes = {
        username: PropTypes.string,
        code: PropTypes.string,
    };

    render() {
        return (
            <form className="Form" method="POST" action="/activeren">
                <fieldset className="Fieldset">
                    <p className="InputField">
                        <label className="Label" htmlFor="username">
                            Registratienummer:
                        </label>
                        <input
                            className="Input Input--text"
                            id="username"
                            name="username"
                            autoComplete="username"
                            defaultValue={this.props.username}
                        />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="code">
                            Activatie-code:
                        </label>
                        <input
                            className="Input Input--code"
                            id="code"
                            name="code"
                            type="code"
                            defaultValue={this.props.code}
                        />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit-primary" type="submit" value="Activeren" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = ActivateForm;

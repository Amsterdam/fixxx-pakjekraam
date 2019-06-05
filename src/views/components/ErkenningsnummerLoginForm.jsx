const React = require('react');

class ErkenningsnummerLoginForm extends React.Component {
    render() {
        return (
            <form className="Form" method="POST" action="/login">
                <fieldset className="Fieldset">
                    <p className="InputField">
                        <label className="Label" htmlFor="username">
                            Erkenningsnummer:
                        </label>
                        <input className="Input Input--number" id="username" name="username" type="text" />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit-primary" type="submit" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = ErkenningsnummerLoginForm;

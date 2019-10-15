const React = require('react');
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');
const PropTypes = require('prop-types');
const Alert = require('./components/Alert.jsx');

class DeleteUserPage extends React.Component {
    propTypes = {
        result: PropTypes.string,
    };

    render() {
        const { result } = this.props;
        return (
            <Page>
                <Header hideLogout={true} />
                <Content>
                    <form
                        className="Form Form--AlgemeneVoorkeurenForm"
                        method="POST"
                        action="/verwijder-ondernemer"
                        encType="application/x-www-form-urlencoded"
                    >
                        <h1>Verwijder ondernemer</h1>
                        <div className="Fieldset">
                            {/* <h2 className="Fieldset__header">Als er ruimte is, hoeveel plaatsen zou je graag in totaal willen?</h2> */}
                            <p className="InputField InputField--number">
                                <label htmlFor="erkenningsNummer" className="Label">Erkenningsnummer:</label>
                                <input
                                    name="erkenningsNummer"
                                    id="erkenningsNummer"
                                    className="Input"
                                />
                            </p>
                        </div>
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="Verwijder"
                        >Verwijder ondernemer</button>
                    </form>
                    { result ? (
                        <Alert type="success" inline={true}>
                            { result }
                        </Alert>
                        ) : null}
                </Content>
            </Page>
        );
    }
}

module.exports = DeleteUserPage;

const React = require('react');
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');
const PropTypes = require('prop-types');

class HomePage extends React.Component {
    propTypes = {
        user: PropTypes.object,
    };

    render() {
        return (
            <Page>
                <Header hideLogout={true} />
                <Content>
                    <h2>Digitaal indelen</h2>
                    <p>
                        U kunt u online aanmelden voor de komende marktdagen op Plein 40-45.
                        <br />
                        Binnenkort kan dit ook voor andere markten in Amsterdam.
                    </p>
                    <h2>Account activeren</h2>
                    <p>
                        Hebt u van het Marktbureau een brief ontvangen over digitaal indelen?
                        <br />
                        <a href="/activeren">Activeer dan nu uw account</a> met de code uit de brief.
                    </p>
                    <h2>Mijn markten</h2>
                    <p>
                        Hebt u uw account geactiveerd? <a href="/login">Log in en meld u aan voor de markt</a>.
                    </p>
                    <h2>Wachtwoord kwijt?</h2>
                    <p>
                        Bent u uw wachtwoord vergeten? Als u een e-mailadres hebt ingesteld, kunt u daarmee een{' '}
                        <a href="https://iam.amsterdam.nl/auth/realms/pakjekraam/login-actions/reset-credentials">
                            nieuw wachtwoord instellen
                        </a>
                        . Lukt het niet om een nieuw wachtwoord te kiezen, neem dan contact op met het{' '}
                        <a href="https://www.amsterdam.nl/adressengids/overig/marktbureau/">Marktbureau</a>.
                    </p>
                    Hebt u nog vragen? Kijk eerst bij de{' '}
                    <a href="https://www.amsterdam.nl/ondernemen/markt-straathandel/digitaal-indelen-plein-40-45/">
                        veelgestelde vragen
                    </a>
                    .<p />
                </Content>
            </Page>
        );
    }
}

module.exports = HomePage;

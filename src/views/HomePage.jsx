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
                <Header user={this.props.user} />
                <Content>
                    <h2>Digitaal inschrijven</h2>
                    <p>
                        Je kunt binnenkort voor een aantal Amsterdamse markten on-line inschrijven voor de markt van
                        morgen.
                    </p>
                    <h2>Account activeren</h2>
                    <p>Heb je van het Marktbureau een uitnodiging ontvangen voor digitaal inschrijven?</p>
                    <p>
                        <a href="/activeren">Activeer dan nu je account</a> met de code uit de brief.
                    </p>
                    <h2>Mijn markten</h2>
                    <p>
                        Heb je de account geactiveerd? <a href="/login">Log in en kies je kraam</a>.
                    </p>
                    <h2>Wachtwoord kwijt?</h2>
                    <p>
                        Ben je het wachtwoord vergeten? Als je een e-mailadres hebt ingesteld, kun je daarmee een{' '}
                        <a href="/herstellen">nieuw wachtwoord instellen</a>. Lukt het niet om een nieuw wachtwoord te
                        kiezen,{' '}
                        <a href="https://www.amsterdam.nl/adressengids/overig/marktbureau/">
                            neem dan contact op met het Marktbureau
                        </a>
                        .
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = HomePage;

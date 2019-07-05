const Content = require('./components/Content');
const Header = require('./components/Header');
const PasswordRecoveryForm = require('./components/PasswordRecoveryForm.jsx');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const React = require('react');

class PasswordRecoveryPage extends React.Component {
    propTypes = {
        messages: PropTypes.array,
        username: PropTypes.string,
        code: PropTypes.string,
    };

    render() {
        return (
            <Page messages={this.props.messages}>
                <Header />
                <Content>
                    <h1 className="h1">Wachtwoord kwijt?</h1>
                    <p>
                        Vul het erkenningsnummer in om een nieuw wachtwoord te kiezen. Het nummer kun je vinden op de
                        marktpas. Je krijgt een e-mail met verdere instructies.
                    </p>
                    <PasswordRecoveryForm {...this.props} />
                </Content>
            </Page>
        );
    }
}

module.exports = PasswordRecoveryPage;

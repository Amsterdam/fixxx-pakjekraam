const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');

class ErrorPage extends React.Component {
    propTypes = {
        errorCode: PropTypes.number,
    };

    render() {
        const { errorCode } = this.props;
        const mmLoginError = 401;

        return (
            <Page>
                <Header hideLogout={true} />
                <Content>
                    <h1>{errorCode}</h1>
                    {errorCode !== mmLoginError ? (
                        <h4>Er is een fout opgetreden</h4>
                    ) : (
                        <h4>
                            Er is een fout opgetreden met het inloggen. Probeer opnieuw in te{' '}
                            <a href="/login">loggen</a>
                        </h4>
                    )}
                </Content>
            </Page>
        );
    }
}

module.exports = ErrorPage;

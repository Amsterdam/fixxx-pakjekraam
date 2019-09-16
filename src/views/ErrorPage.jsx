const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');

class ErrorPage extends React.Component {
    propTypes = {
        message: PropTypes.string,
        stack: PropTypes.string,
        errorCode: PropTypes.number,
        req: PropTypes.object,
    };

    render() {
        const { message, stack, errorCode, req } = this.props;
        const mmLoginError = 401;

        return (
            <Page>
                <Header hideLogout={true} />
                <Content>
                    <h4>
                        Er is een fout opgetreden. <br />
                        Probeer opnieuw <a href={`/login?next=${req ? req.originalUrl : ''}`}>in te loggen</a>
                    </h4>

                    <p>{message}</p>

                    <p>{stack}</p>
                </Content>
            </Page>
        );
    }
}

module.exports = ErrorPage;

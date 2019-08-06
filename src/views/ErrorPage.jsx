const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');

class ErrorPage extends React.Component {
    propTypes = {
        errorCode: PropTypes.number,
        req: PropTypes.object
    };

    render() {
        const { errorCode, req } = this.props;
        const mmLoginError = 401;

        return (
            <Page>
                <Header hideLogout={true} />
                <Content>
                    <h4>
                        Er is een fout opgetreden. <br/>Probeer opnieuw in te{' '}
                        <a href={`/login?next=${req ? req.originalUrl : ''}`}>loggen</a>
                    </h4>
                </Content>
            </Page>
        );
    }
}

module.exports = ErrorPage;

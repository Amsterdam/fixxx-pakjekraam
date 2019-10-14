const React = require('react');
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');
const PropTypes = require('prop-types');

class DeleteUserPage extends React.Component {

    propTypes = {
        user: PropTypes.object,
    };

    render() {
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
                        <button
                                className="Button Button--secondary"
                                type="submit"
                                name="Verwijder"
                        >Verwijder ondernemer</button>
                    </form>
                </Content>
            </Page>
        );
    }
}

module.exports = DeleteUserPage;

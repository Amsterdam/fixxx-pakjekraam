const React = require('react');
const Page = require('./components/Page.jsx');
const MainNavigation = require('./components/MainNavigation.jsx');

class HomePage extends React.Component {
    render() {
        return (
            <Page>
                <h1>Fixxx: Pak Je Kraam</h1>
                <MainNavigation />
            </Page>
        );
    }
}

module.exports = HomePage;

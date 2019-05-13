const React = require('react');
const Page = require('./components/Page.jsx');
const MainNavigation = require('./components/MainNavigation.jsx');
const Header = require('./components/Header');

class HomePage extends React.Component {
    render() {
        return (
            <Page>
                <Header>
                    <MainNavigation />
                </Header>
            </Page>
        );
    }
}

module.exports = HomePage;

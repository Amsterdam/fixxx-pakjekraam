const React = require('react');
const Page = require('./Page.jsx');

class MainNavigation extends React.Component {
    render() {
        return (
            <nav>
                <a href="/login">Login</a>
                <a href="/markt/">Markten</a>
            </nav>
        );
    }
}

module.exports = MainNavigation;

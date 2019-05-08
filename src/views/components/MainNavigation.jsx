const React = require('react');
const Page = require('./Page.jsx');

class MainNavigation extends React.Component {
    render() {
        return (
            <nav>
                <a href="/login">Login</a>
            </nav>
        );
    }
}

module.exports = MainNavigation;

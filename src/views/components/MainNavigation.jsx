const React = require('react');
const Page = require('./Page.jsx');

class MainNavigation extends React.Component {
    render() {
        return (
            <nav>
                <ul>
                    <li>
                        <a href="/login">Login</a>
                    </li>
                    <li>
                        <a href="/markt/">Markten</a>
                    </li>
                </ul>
            </nav>
        );
    }
}

module.exports = MainNavigation;

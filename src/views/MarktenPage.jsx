const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const MainNavigation = require('./components/MainNavigation.jsx');

class MarktenPage extends React.Component {
    propTypes = {
        markten: PropTypes.array,
    };

    render() {
        return (
            <Page>
                <h1>Overzicht markten</h1>
                <ul>
                    {this.props.markten.map(markt => (
                        <li key={markt.id}>
                            <a href={`/markt/${markt.id}/`}>{markt.naam}</a>
                        </li>
                    ))}
                </ul>
            </Page>
        );
    }
}

module.exports = MarktenPage;

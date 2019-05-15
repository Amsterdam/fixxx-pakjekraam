const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const MainNavigation = require('./components/MainNavigation.jsx');
const Header = require('./components/Header');
const Content = require('./components/Content');
const MarktList = require('./components/MarktList');

class MarktenPage extends React.Component {
    propTypes = {
        markten: PropTypes.array,
    };

    render() {
        return (
            <Page>
                <Header />
                <Content>
                    <h2>Indelingslijsten</h2>
                    <MarktList markten={this.props.markten} />
                </Content>
            </Page>
        );
    }
}

module.exports = MarktenPage;

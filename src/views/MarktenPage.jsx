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
        user: PropTypes.object,
    };

    render() {
        const breadcrumbs = [];
        return (
            <Page>
                <Header
                    user={this.props.user}
                    breadcrumbs={breadcrumbs}
                />
                <Content>
                    <h1 className="h1">Markten</h1>
                    <MarktList markten={this.props.markten} />
                </Content>
            </Page>
        );
    }
}

module.exports = MarktenPage;

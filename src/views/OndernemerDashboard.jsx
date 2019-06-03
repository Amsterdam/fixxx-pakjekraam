const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const MainNavigation = require('./components/MainNavigation.jsx');
const Header = require('./components/Header');
const Content = require('./components/Content');
const MarktList = require('./components/MarktList');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');

class OndernemerDashboard extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        markten: PropTypes.array,
        user: PropTypes.object,
    };

    render() {
        const { ondernemer, user, markten } = this.props;
        console.log(ondernemer);
        return (
            <Page>
                {/*<Header user={this.props.user} />*/}
                <Content>
                    <OndernemerProfileHeader user={ondernemer} />
                    <h1 className="h1">Markten</h1>
                    {/*<MarktList markten={markten} />*/}
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerDashboard;

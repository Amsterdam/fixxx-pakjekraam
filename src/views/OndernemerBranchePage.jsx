const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerChangeBrancheForm = require('./components/OndernemerChangeBrancheForm');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');

class OndernemerBranchePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
        branches: PropTypes.array.isRequired,
        query: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { ondernemer } = this.props;

        return (
            <Page>
                <Header user={ondernemer} logoUrl={`/dashboard/${ondernemer.erkenningsnummer}`}>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                <Content>
                    <OndernemerChangeBrancheForm {...this.props} />
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerBranchePage;

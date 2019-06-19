const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerChangeBrancheForm = require('./components/OndernemerChangeBrancheForm');

class OndernemerBranchePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
        branches: PropTypes.array.isRequired,
        query: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        return (
            <Page>
                <Header user={this.props.user} />
                <Content>
                    <OndernemerChangeBrancheForm {...this.props} />
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerBranchePage;

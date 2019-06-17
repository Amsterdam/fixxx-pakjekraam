const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerChangeBrancheForm = require('./components/OndernemerChangeBrancheForm');

class OndernemerBranchePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
        markten: PropTypes.array.isRequired,
        query: PropTypes.string,
    };

    render() {
        return (
            <Page>
                <OndernemerChangeBrancheForm {...this.props} />
            </Page>
        );
    }
}

module.exports = OndernemerBranchePage;

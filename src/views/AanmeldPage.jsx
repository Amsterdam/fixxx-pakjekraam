const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const AanmeldForm = require('./components/AanmeldForm.jsx');

class AanmeldPage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        return (
            <Page>
                <AanmeldForm ondernemer={this.props.ondernemer} />
            </Page>
        );
    }
}

module.exports = AanmeldPage;

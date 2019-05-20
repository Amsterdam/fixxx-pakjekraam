const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const AanmeldForm = require('./components/AanmeldForm.jsx');

class AanmeldPage extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        date: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        return (
            <Page>
                <AanmeldForm
                    aanmeldingen={this.props.aanmeldingen}
                    ondernemer={this.props.ondernemer}
                    date={this.props.date}
                />
            </Page>
        );
    }
}

module.exports = AanmeldPage;

import Content from './components/Content';
const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const AanmeldForm = require('./components/AanmeldForm.jsx');
import Header from './components/Header';

class AanmeldPage extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        date: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        markt: PropTypes.object,
    };

    render() {
        return (
            <Page>
                <Header />
                <Content>
                    <AanmeldForm
                        aanmeldingen={this.props.aanmeldingen}
                        ondernemer={this.props.ondernemer}
                        date={this.props.date}
                        markt={this.props.markt}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = AanmeldPage;

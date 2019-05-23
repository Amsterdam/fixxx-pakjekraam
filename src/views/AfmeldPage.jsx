import Content from './components/Content';

const React = require('react');
const Page = require('./components/Page.jsx');
const AfmeldForm = require('./components/AfmeldForm.jsx');
const PropTypes = require('prop-types');
import Header from './components/Header';

class AfmeldPage extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        date: PropTypes.string.isRequired,
        markten: PropTypes.array,
        ondernemer: PropTypes.object.isRequired,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
        currentMarktId: PropTypes.string,
    };

    render() {
        return (
            <Page>
                <Header />
                <Content>
                    <AfmeldForm
                        aanmeldingen={this.props.aanmeldingen}
                        date={this.props.date}
                        ondernemer={this.props.ondernemer}
                        markten={this.props.markten}
                        startDate={this.props.startDate}
                        endDate={this.props.endDate}
                        currentMarktId={this.props.currentMarktId}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = AfmeldPage;

const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PlaatsvoorkeurenForm = require('./components/PlaatsvoorkeurenForm.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');

class VoorkeurenPage extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        markten: PropTypes.array.isRequired,
        ondernemer: PropTypes.object.isRequired,
        query: PropTypes.string,
    };

    render() {
        return (
            <Page>
                <Header />
                <Content>
                    <PlaatsvoorkeurenForm
                        plaatsvoorkeuren={this.props.plaatsvoorkeuren}
                        ondernemer={this.props.ondernemer}
                        markten={this.props.markten}
                        query={this.props.query}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = VoorkeurenPage;

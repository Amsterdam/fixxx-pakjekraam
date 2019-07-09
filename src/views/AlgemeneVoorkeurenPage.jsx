const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const AlgemeneVoorkeurenForm = require('./components/AlgemeneVoorkeurenForm.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');

class AlgemeneVoorkeurenPage extends React.Component {
    propTypes = {
        marktId: PropTypes.string,
        marktDate: PropTypes.string,
        ondernemer: PropTypes.object.isRequired,
        markt: PropTypes.object,
        voorkeur: PropTypes.object,
        branches: PropTypes.array.isRequired,
        next: PropTypes.string,
        query: PropTypes.string,
        messages: PropTypes.array,
    };

    render() {
        const { ondernemer, messages } = this.props;

        return (
            <Page messages={messages}>
                <Header user={ondernemer} logoUrl="/dashboard/">
                    <a className="Header__nav-item" href="/dashboard/">
                        Mijn markten
                    </a>
                    <OndernemerProfileHeader user={ondernemer} />
                </Header>
                <Content>
                    <AlgemeneVoorkeurenForm
                        branches={this.props.branches}
                        markt={this.props.markt}
                        marktId={this.props.marktId}
                        marktDate={this.props.marktDate}
                        ondernemer={this.props.ondernemer}
                        voorkeur={this.props.voorkeur}
                        query={this.props.query}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = AlgemeneVoorkeurenPage;

const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const AfmeldForm = require('./components/AfmeldForm.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');

class AfmeldPage extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        date: PropTypes.string.isRequired,
        markten: PropTypes.array,
        ondernemer: PropTypes.object.isRequired,
        messages: PropTypes.array,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
        currentMarktId: PropTypes.string,
        query: PropTypes.string,
        role: PropTypes.string,
    };

    render() {
        const { ondernemer, messages, role } = this.props;

        return (
            <Page messages={messages}>
                <Header user={this.props.ondernemer} logoUrl={role === 'marktmeester' ? '/markt/' : '/dashboard/'}>
                    <a className="Header__nav-item" href={role === 'marktmeester' ? '/markt/' : '/dashboard/'}>
                        {role === 'marktmeester' ? 'Markten' : 'Mijn markten'}
                    </a>
                    <OndernemerProfileHeader user={this.props.ondernemer} />
                </Header>
                <Content>
                    <AfmeldForm
                        aanmeldingen={this.props.aanmeldingen}
                        date={this.props.date}
                        ondernemer={this.props.ondernemer}
                        markten={this.props.markten}
                        startDate={this.props.startDate}
                        endDate={this.props.endDate}
                        currentMarktId={this.props.currentMarktId}
                        query={this.props.query}
                        role={this.props.role}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = AfmeldPage;

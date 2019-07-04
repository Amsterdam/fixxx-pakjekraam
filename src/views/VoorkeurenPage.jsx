const Content = require('./components/Content');
const React = require('react');
const Page = require('./components/Page.jsx');
const PlaatsvoorkeurenForm = require('./components/PlaatsvoorkeurenForm.jsx');
const PropTypes = require('prop-types');
const Header = require('./components/Header');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');

class VoorkeurenPage extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        markten: PropTypes.array.isRequired,
        ondernemer: PropTypes.object.isRequired,
        marktPaginas: PropTypes.object,
        marktProperties: PropTypes.object,
        marktPlaatsen: PropTypes.object,
        messages: PropTypes.array,
        query: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { marktProperties, marktPaginas, marktPlaatsen } = this.props;
        const rows = (
            marktProperties.rows ||
            marktPaginas.reduce(
                (list, pagina) => [
                    ...list,
                    ...pagina.indelingslijstGroup.map(group => group.plaatsList).filter(Array.isArray),
                ],
                [],
            )
        ).map(row =>
            row.map(plaatsId => marktPlaatsen.find(plaats => plaats.plaatsId === plaatsId)).map(plaats => plaats),
        );

        return (
            <Page messages={this.props.messages}>
                <Header user={this.props.user}>
                    <OndernemerProfileHeader user={this.props.ondernemer} />
                </Header>
                <Content>
                    <PlaatsvoorkeurenForm
                        plaatsvoorkeuren={this.props.plaatsvoorkeuren}
                        ondernemer={this.props.ondernemer}
                        markt={this.props.markten[0]}
                        rows={rows}
                        query={this.props.query}
                    />
                </Content>
            </Page>
        );
    }
}

module.exports = VoorkeurenPage;

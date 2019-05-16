const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const MainNavigation = require('./components/MainNavigation.jsx');
const Header = require('./components/Header');
const Content = require('./components/Content');
const Indelingslijst = require('./components/Indelingslijst');
const PrintButton = require('./components/PrintButton');

class MarktenPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {
                aanmeldingen: [],
                branches: [],
                locaties: [],
                geografie: {
                    obstakels: [],
                },
                ondernemers: [],
                paginas: [],
                voorkeuren: [],
            },
        };
    }

    propTypes = {
        data: PropTypes.array,
        marktSlug: PropTypes.string,
        marktId: PropTypes.string,
    };

    render() {
        const { aanmeldingen, branches, geografie, locaties, ondernemers, paginas, voorkeuren } = this.props.data;

        const pl = {},
            vphl = {},
            obstakels = {};

        let i, j;

        for (i = 0; i < locaties.length; i++) {
            let l = locaties[i].locatie;

            l = l.toString();
            pl[locaties[i].locatie] = locaties[i];
        }
        for (i = 0; i < ondernemers.length; i++) {
            if (ondernemers.locatie !== null && ondernemers[i].status === 'vpl') {
                vphl[String(ondernemers[i].locatie)] = ondernemers[i];
            }
        }
        for (i = 0; i < geografie.obstakels.length; i++) {
            const plaats = String(geografie.obstakels[i].kraamA);

            if (!(obstakels[plaats] instanceof Array)) {
                obstakels[plaats] = [];
            }
            obstakels[String(plaats)].push(geografie.obstakels[i].obstakel);
        }

        const obj = {
            aanmeldingen,
            branches,
            locaties: pl,
            obstakels,
            ondernemers: vphl,
            paginas,
            voorkeuren,
        };
        const markt = {
            slug: this.props.marktSlug,
            id: this.props.marktId,
        };

        return (
            <Page bodyClass="page-markt-detail">
                <Header />
                <Content>
                    <div className="MarktDetailPage">
                        <h2>Indelingslijst</h2>
                        <PrintButton title="Print indelingslijst"/>
                        <Indelingslijst data={obj} markt={markt} />
                    </div>
                </Content>
            </Page>
        );
    }
}

module.exports = MarktenPage;

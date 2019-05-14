const React = require('react');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const MainNavigation = require('./components/MainNavigation.jsx');
const Header = require('./components/Header');
const Content = require('./components/Content');
const Looplijst = require('./components/Looplijst');

class MarktenPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {
                aanmeldingen: [],
                branches: [],
                locaties: [],
                geografie: {
                    obstakels: []
                },
                ondernemers: [],
                paginas: [],
                voorkeuren: []
            }
        };
    }

    propTypes = {
        data: PropTypes.array,
    };

    render() {
        const { aanmeldingen, branches, geografie, locaties, ondernemers, paginas, voorkeuren } = this.props.data;

        let pl = {},
            vphl = {},
            i = 0,
            obstakels = {};


        for (i = 0; i < locaties.length; i++) {
            pl[locaties[i].locatie] = locaties[i];
        }
        for (i = 0; i < ondernemers.length; i++) {
            if (ondernemers.locatie !== null && ondernemers[i].status === 'vpl') {
                vphl[ondernemers[i].locatie] = ondernemers[i];
            }
        }
        for (i = 0; i < geografie.obstakels.length; i++) {
            const plaats = geografie.obstakels[i].kraamA;
            if (!(obstakels[plaats] instanceof Array)) {
                obstakels[plaats] = [];
            }
            obstakels[plaats].push(obstakellList[i].obstakel);
        }
        let obj = {
            aanmeldingen: aanmeldingen,
            branches: branches,
            locaties: pl,
            obstakels: obstakels,
            ondernemers: vphl,
            paginas: paginas,
            voorkeuren: voorkeuren
        }

        return (
            <Page bodyClass="page-markt-detail">
                <Header/>
                <Content>
                    <h2>Looplijsten</h2>
                    <Looplijst data={obj}/>
                </Content>
            </Page>
        );
    }
}

module.exports = MarktenPage;

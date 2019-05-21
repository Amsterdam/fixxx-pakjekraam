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
                markt: {},
            },
        };
    }

    propTypes = {
        data: PropTypes.array,
        marktSlug: PropTypes.string,
        marktId: PropTypes.string,
    };

    render() {
        const {
            aanmeldingen,
            branches,
            geografie,
            locaties,
            ondernemers,
            paginas,
            voorkeuren,
            markt,
        } = this.props.data;

        const arrayToObject = (array, keyField) =>
            array.reduce((obj, item) => {
                obj[item[keyField]] = item;

                return obj;
            }, {});

        const ondernemersToLocatieKeyValue = array =>
            array.reduce((obj, item) => {
                item.locatie.reduce((ar, i) => {
                    obj[i] = item;

                    return ar;
                }, {});

                return obj;
            }, {});

        const pl = arrayToObject(locaties, 'locatie');
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const obstakels = geografie.obstakels.reduce((total, obstakel) => {
            total[String(obstakel.kraamA)] = total[String(obstakel.kraamA)] || [];
            total[String(obstakel.kraamA)].push(obstakel.obstakel);

            return total;
        }, {});

        const obj = {
            aanmeldingen,
            branches,
            locaties: pl,
            obstakels,
            ondernemers: vphl,
            paginas,
            voorkeuren,
        };

        return (
            <Page bodyClass="page-markt-detail">
                <Header />
                <Content>
                    <div className="MarktDetailPage">
                        <h2>Indelingslijst</h2>
                        <PrintButton title="Print indelingslijst" />
                        <Indelingslijst data={obj} markt={markt} />
                    </div>
                </Content>
            </Page>
        );
    }
}

module.exports = MarktenPage;

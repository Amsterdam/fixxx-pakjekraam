const React = require('react');
const PropTypes = require('prop-types');
const PrintButton = require('./components/PrintButton');
const MarktDetailBase = require('./components/MarktDetailBase');
const MarktDayLink = require('./components/MarktDayLink.jsx');
const Indelingslijst = require('./components/Indelingslijst');
const { ondernemersToLocatieKeyValue, obstakelsToLocatieKeyValue } = require('../domain-knowledge.js');
const { arrayToObject } = require('../util.js');

class IndelingslijstenPage extends React.Component {
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
        datum: PropTypes.string,
        type: PropTypes.string,
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
        const { datum, type } = this.props;
        const pl = arrayToObject(locaties, 'locatie');
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const obstakels = obstakelsToLocatieKeyValue(geografie.obstakels);

        const obj = {
            aanmeldingen,
            branches,
            locaties: pl,
            obstakels,
            ondernemers: vphl,
            paginas,
            voorkeuren,
        };

        console.log(new Date(datum));

        return (
            <MarktDetailBase bodyClass="page-markt-indelingslijst">
                <div className="MarktDetailPage">
                    <div className="MarktDetailPage__header">
                        <h2>Indelingslijst</h2>
                        <PrintButton title="Print indelingslijst" />
                        <p>
                            <MarktDayLink markt={markt} offsetDate={new Date(datum).toISOString()} direction={-1} />
                        </p>
                        <p>
                            <MarktDayLink markt={markt} offsetDate={new Date(datum).toISOString()} direction={1} />
                        </p>
                    </div>
                    <Indelingslijst data={obj} markt={markt} datum={datum} type={type} />
                </div>
            </MarktDetailBase>
        );
    }
}

module.exports = IndelingslijstenPage;

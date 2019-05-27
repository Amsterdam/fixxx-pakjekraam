const React = require('react');
const PropTypes = require('prop-types');
const PrintButton = require('./components/PrintButton');
const MarktDetailBase = require('./components/MarktDetailBase');
const MarktDayLink = require('./components/MarktDayLink.jsx');
const Indelingslijst = require('./components/Indelingslijst');
const { ondernemersToLocatieKeyValue, obstakelsToLocatieKeyValue } = require('../domain-knowledge.js');
const { arrayToObject } = require('../util.js');
const MarktDetailHeader = require('./components/MarktDetailHeader');

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
        user: PropTypes.object,
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
        const { datum, type, user } = this.props;
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
            <MarktDetailBase
                bodyClass="page-markt-indelingslijst page-print"
                title="Indelingslijst"
                markt={markt}
                type={type}
                datum={datum}
                user={user}
                showDate={true}
            >
                <Indelingslijst data={obj} markt={markt} datum={datum} type={type} />
            </MarktDetailBase>
        );
    }
}

module.exports = IndelingslijstenPage;

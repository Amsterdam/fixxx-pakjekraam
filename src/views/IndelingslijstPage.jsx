const React = require('react');
const PropTypes = require('prop-types');
const MarktDetailBase = require('./components/MarktDetailBase');
const { ondernemersToLocatieKeyValue, obstakelsToLocatieKeyValue } = require('../domain-knowledge.js');
const { arrayToObject } = require('../util.js');
const IndelingslijstGroup = require('./components/IndelingslijstGroup');
const PrintPage = require('./components/PrintPage');
const Street = require('./components/Street');

class IndelingslijstenPage extends React.Component {
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
            toewijzingen,
            markt,
        } = this.props.data;
        const { datum, type, user } = this.props;
        const plaatsList = arrayToObject(locaties, 'plaatsId');
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const obstakels = obstakelsToLocatieKeyValue(geografie.obstakels);

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
                {paginas.map((page, j) => {
                    return (
                        <PrintPage key={j} index={j} title={`Indelingslijst ${markt.naam}`} label="Markt ">
                            {page.indelingslijstGroup.map((pageItem, i) => {
                                if (pageItem.type && pageItem.type === 'street') {
                                    return <Street title={pageItem.title} />;
                                } else {
                                    return (
                                        <IndelingslijstGroup
                                            key={i}
                                            page={pageItem}
                                            plaatsList={plaatsList}
                                            vphl={vphl}
                                            obstakelList={obstakels}
                                            aanmeldingen={aanmeldingen}
                                            toewijzingen={toewijzingen}
                                            markt={markt}
                                            datum={datum}
                                            type={type}
                                        />
                                    );
                                }
                            })}
                        </PrintPage>
                    );
                })}
            </MarktDetailBase>
        );
    }
}

module.exports = IndelingslijstenPage;

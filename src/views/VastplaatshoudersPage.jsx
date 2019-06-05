const { arrayToObject } = require('../util.js');
const IndelingslijstGroup = require('./components/IndelingslijstGroup');
const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const PrintPage = require('./components/PrintPage');
const PropTypes = require('prop-types');
const { ondernemersToLocatieKeyValue, obstakelsToLocatieKeyValue } = require('../domain-knowledge.js');
const Street = require('./components/Street');

class VastplaatshoudersPage extends React.Component {
    propTypes = {
        data: PropTypes.object.isRequired,
        datum: PropTypes.string,
        type: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { datum, type, user } = this.props;
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

        const obstakels = obstakelsToLocatieKeyValue(geografie.obstakels);
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const locatiesObject = arrayToObject(locaties, 'plaatsId');
        const aanmeldingenOrdered = aanmeldingen.sort((a, b) => b.updatedAt - a.updatedAt);

        return (
            <MarktDetailBase
                bodyClass="page-markt-vasteplaatshouders page-print"
                title={`Vasteplaatshouders`}
                markt={markt}
                datum={datum}
                type={type}
                user={user}
                showDate={false}
            >
                {paginas.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={markt.naam}>
                        {pagina.indelingslijstGroup.map((pageItem, ii) => {
                            if (pageItem.type && pageItem.type === 'street') {
                                return <Street title={pageItem.title} />;
                            } else {
                                return (
                                    <IndelingslijstGroup
                                        key={ii}
                                        page={pageItem}
                                        plaatsList={locatiesObject}
                                        vphl={vphl}
                                        obstakelList={obstakels}
                                        aanmeldingen={aanmeldingenOrdered}
                                        markt={markt}
                                        type={type}
                                        datum={datum}
                                    />
                                );
                            }
                        })}
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = VastplaatshoudersPage;

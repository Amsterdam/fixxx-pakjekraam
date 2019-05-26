const { arrayToObject } = require('../util.js');
import IndelingslijstGroup from './components/IndelingslijstGroup';
const React = require('react');
import MarktDetailBase from './components/MarktDetailBase';
import PrintPage from './components/PrintPage';
const PropTypes = require('prop-types');
const { ondernemersToLocatieKeyValue, obstakelsToLocatieKeyValue } = require('../domain-knowledge.js');
import Street from './components/Street';

class VastplaatshoudersPage extends React.Component {
    propTypes = {
        data: PropTypes.object.isRequired,
        datum: PropTypes.string,
        type: PropTypes.string,
    };

    render() {
        const { datum, type } = this.props;
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
        const locatiesObject = arrayToObject(locaties, 'locatie');

        return (
            <MarktDetailBase
                bodyClass="page-markt-vasteplaatshouders page-print"
                title={`${markt.naam}: Vasteplaatshouders`}
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
                                        aanmeldingen={aanmeldingen}
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

const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList.tsx');
const PrintPage = require('./components/PrintPage');
const PropTypes = require('prop-types');
const { paginate } = require('../util');
const { calcVolgorde, isAanwezig } = require('../indeling');

class VoorrangslijstPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        aLijst: PropTypes.array,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        type: PropTypes.string,
        user: PropTypes.object,
        toewijzingen: PropTypes.array.isRequired,
    };

    render() {
        const { markt, aLijst, aanmeldingen, voorkeuren, datum, type, user, toewijzingen } = this.props;
        let { ondernemers } = this.props;
        const itemsOnPage = 50;

        ondernemers = ondernemers.filter(
            ondernemer =>
                !toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === ondernemer.erkenningsNummer),
        );

        ondernemers = calcVolgorde(ondernemers, aLijst);
        ondernemers = [
            ...ondernemers.filter(ondernemer => isAanwezig(aanmeldingen, ondernemer)),
            ...ondernemers.filter(ondernemer => !isAanwezig(aanmeldingen, ondernemer)),
        ];

        const paginas = paginate(ondernemers, itemsOnPage);
        const paginasLists = paginate(paginas, 2);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title="Voorrangslijst"
                markt={markt}
                datum={datum}
                type={type}
                user={user}
                showDate={false}
            >
                {paginasLists.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={`Voorrangslijst: ${markt.naam}`} datum={datum}>
                        {pagina.map((list, j) => (
                            <OndernemerList
                                key={j}
                                ondernemers={list}
                                markt={markt}
                                type={type}
                                datum={datum}
                                aanmeldingen={aanmeldingen}
                            />
                        ))}
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = VoorrangslijstPage;

const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList');
const PrintPage = require('./components/PrintPage');
const PropTypes = require('prop-types');
const { paginate } = require('../util');

class VoorrangslijstPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        type: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { markt, ondernemers, aanmeldingen, voorkeuren, datum, type, user } = this.props;
        const itemsOnPage = 50;
        const aanmeldingenOrdered = aanmeldingen.sort((a, b) => b.updatedAt - a.updatedAt);

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
                showDate={true}
            >
                {paginasLists.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={`Voorrangslijst: ${markt.naam}`}>
                        {pagina.map((list, j) => (
                            <OndernemerList
                                key={j}
                                ondernemers={list}
                                markt={markt}
                                type={type}
                                datum={datum}
                                aanmeldingen={aanmeldingenOrdered}
                            />
                        ))}
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = VoorrangslijstPage;

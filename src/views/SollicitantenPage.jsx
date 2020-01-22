const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList.tsx');
const PrintPage = require('./components/PrintPage');
const PropTypes = require('prop-types');
const { paginate } = require('../util');

class SollicitantenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        user: PropTypes.object,
        role: PropTypes.string,
    };

    render() {
        const { markt, ondernemers, aanmeldingen, datum, role } = this.props;
        const itemsOnPage = 40;
        const aanmeldingenOrdered = aanmeldingen.sort((a, b) => b.updatedAt - a.updatedAt);

        const paginas = paginate(ondernemers, itemsOnPage);
        const paginasLists = paginate(paginas, 2);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title="Sollicitanten, VKK en TVPL"
                markt={markt}
                datum={datum}
                role={role}
                type={type}
                showDate={false}
            >
                {paginasLists.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={`Sollicitanten: ${markt.naam}`} datum={datum}>
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

module.exports = SollicitantenPage;

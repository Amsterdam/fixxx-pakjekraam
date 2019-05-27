const React = require('react');
import MarktDetailBase from './components/MarktDetailBase';
import OndernemerList from './components/OndernemerList';
import PrintPage from './components/PrintPage';
const PropTypes = require('prop-types');

class SollicitantenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        datum: PropTypes.string,
        type: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { markt, ondernemers, datum, type, user } = this.props;
        const itemsOnPage = 25;
        const paginas = ondernemers
            .map((ondernemer, i) => {
                if (i % itemsOnPage === 0) {
                    return ondernemers.filter((o, j) => {
                        return j >= i && j < i + itemsOnPage;
                    });
                } else {
                    return null;
                }
            })
            .filter(ondernemer => {
                return !!ondernemer;
            });

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title="Sollicitanten afmelden"
                markt={markt}
                datum={datum}
                type={type}
                user={user}
            >
                {paginas.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={markt}>
                        <OndernemerList ondernemers={pagina} markt={markt} type={type} datum={datum} />
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = SollicitantenPage;

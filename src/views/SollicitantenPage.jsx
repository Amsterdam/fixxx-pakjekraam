const React = require('react');
import MarktDetailBase from './components/MarktDetailBase';
import OndernemerList from './components/OndernemerList';
import PrintPage from './components/PrintPage';

const PropTypes = require('prop-types');

class SollicitantenPage extends React.Component {
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
        const { markt, ondernemers, aanmeldingen, datum, type, user } = this.props;
        const itemsOnPage = 25;
        console.log(aanmeldingen);
        const paginas = ondernemers
            .map((ondernemer, i) => {
                if (i % itemsOnPage === 0) {
                    return ondernemers
                        .sort((a, b) => {
                            return a.sollicitatieNummer < b.sollicitatieNummer;
                        })
                        .filter((o, j) => {
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
                title="Sollicitanten aanmelden"
                markt={markt}
                datum={datum}
                type={type}
                user={user}
                showDate={false}
            >
                {paginas.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={markt.naam}>
                        <OndernemerList ondernemers={pagina} markt={markt} type={type} datum={datum} />
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = SollicitantenPage;

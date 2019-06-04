const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList');
const PrintPage = require('./components/PrintPage');
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
        const { markt, ondernemers, aanmeldingen, voorkeuren, datum, type, user } = this.props;
        const itemsOnPage = 50;

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
        const paginasLists = paginas
            .map((p, i) => {
                return i % 2 === 0
                    ? paginas.filter((pp, j) => {
                          return j >= i && j < i + 2;
                      })
                    : null;
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
                {paginasLists.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={`Sollicitanten: ${markt.naam}`}>
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

module.exports = SollicitantenPage;

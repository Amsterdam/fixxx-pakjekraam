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
        const itemsOnPage = 40;

        ondernemers = ondernemers.filter(
            ondernemer =>
                !toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === ondernemer.erkenningsNummer),
        );

        ondernemers = calcVolgorde(ondernemers, aLijst);
        ondernemers = [
            ...ondernemers.filter(ondernemer => isAanwezig(aanmeldingen, ondernemer)),
            ...ondernemers.filter(ondernemer => !isAanwezig(aanmeldingen, ondernemer)),
        ];
        const aLijstAangemeld = 0;
        const Aangemeld = 1;
        const aLijstNietAangemeld = 2;
        const NietAangemeld = 3;
        const ondernemersGrouped = ondernemers
            .reduce(
                (total, ondernemer) => {
                    total[
                        isAanwezig(aanmeldingen, ondernemer) && aLijst.includes(ondernemer)
                            ? aLijstAangemeld
                            : isAanwezig(aanmeldingen, ondernemer) && !aLijst.includes(ondernemer)
                            ? Aangemeld
                            : !isAanwezig(aanmeldingen, ondernemer) && aLijst.includes(ondernemer)
                            ? aLijstNietAangemeld
                            : !isAanwezig(aanmeldingen, ondernemer) && !aLijst.includes(ondernemer)
                            ? NietAangemeld
                            : NietAangemeld
                    ].push(ondernemer);

                    return total;
                },
                [[], [], [], []],
            )
            .map(group => paginate(paginate(group, itemsOnPage), 2));

        const titles = [
            `Voorrangslijst A lijst, aangemeld: ${markt.naam}`,
            `Voorrangslijst aangemeld: ${markt.naam}`,
            `Voorrangslijst A lijst, niet aangemeld: ${markt.naam}`,
            `Voorrangslijst niet aangemeld: ${markt.naam}`,
        ];

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
                {ondernemersGrouped.map((group, i) =>
                    group.length > 0
                        ? group.map((page, k) => (
                              <PrintPage
                                  key={k}
                                  title={`${titles[i]}${
                                      group.length > 1 ? ' (' + (k + 1) + ' - ' + group.length + ')' : ''
                                  }`}
                                  datum={datum}
                              >
                                  {page.map((list, j) => (
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
                          ))
                        : null,
                )}
            </MarktDetailBase>
        );
    }
}

module.exports = VoorrangslijstPage;

const {
    addDays,
    DAYS_IN_WEEK,
    SUNDAY,
    formatDayOfWeek,
    formatMonth,
    nextWeek,
    capitalize,
    relativeHumanDay,
    endOfWeek,
    yyyyMmDdtoDDMMYYYY,
} = require('../util.ts');
const React = require('react');
const PropTypes = require('prop-types');
const MarktDetailBase = require('./components/MarktDetailBase');
const AlertLine = require('./components/AlertLine');
const today = () => new Date().toISOString().replace(/T.+/, '');
const { getUpcomingMarktDays, parseMarktDag, A_LIJST_DAYS } = require('../domain-knowledge.js');

class MarktDetailPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        user: PropTypes.object,
        type: PropTypes.string,
        role: PropTypes.string,
        datum: PropTypes.string,
    };

    render() {
        const { markt, datum, type, role, user } = this.props;
        const startDate = addDays(today(), -1);
        const endDate = addDays(endOfWeek(), DAYS_IN_WEEK);
        const marktDagen = (markt.marktDagen || []).map(parseMarktDag);
        const dates = getUpcomingMarktDays(startDate, endDate, (markt.marktDagen || []).map(parseMarktDag)).map(
            (d, i) => {
                return {
                    relativeDay: relativeHumanDay(d),
                    date: d,
                    day: new Date(d).getDate(),
                    month: formatMonth(d),
                    weekDay: formatDayOfWeek(new Date(d)),
                    marktDag: marktDagen[new Date(d).getDay()],
                    weekDayInt: new Date(d).getDay(),
                };
            },
        );
        const nextVrijday = new Date(addDays(today(), DAYS_IN_WEEK - new Date().getDay()));

        let fase = null;
        markt.kiesJeKraamFase == 'live' ? fase = null : fase = ` ${markt.kiesJeKraamFase}`;

        const datesThisWeek = dates.filter(({ date }) => new Date(date) < nextVrijday);
        const datesNextWeek = dates.filter(({ date }) => new Date(date) >= nextVrijday);

        return (
            <MarktDetailBase bodyClass="page-markt-detail" datum={datum} type={type} markt={markt} fase={fase} user={user} role={role}>
                <div className="Section Section--column">
                    <a href={`./langdurig-afgemeld/`} className="Link">Ondernemers langdurig afgemeld</a>
                    {markt.kiesJeKraamFase !== 'wenperiode' ?
                        <a href={`./${today()}/alle-sollicitanten/`} className="Link">Alle sollicitanten</a> : null
                    }
                    {markt.kiesJeKraamFase === 'activatie' || markt.kiesJeKraamFase === 'voorbereiding' ?
                        <a href={`./${today()}/indelingslijst/`} className="Link">Positie vasteplaasthouders</a> : null
                    }
                    {markt.kiesJeKraamFase === 'wenperiode' || markt.kiesJeKraamFase === 'live' ?
                        <a href={`/pdf/kaart-${markt.afkorting}.pdf`} rel="noopener noreferrer" target="_blank" className="Link">Kaart {markt.naam}</a> : null
                    }
                </div>
                {markt.kiesJeKraamGeblokkeerdePlaatsen ?
                    <AlertLine
                        type="warning"
                        title="Geblokkeerde plaatsen"
                        titleSmall={true}
                        message={`Plaatsen: ${markt.kiesJeKraamGeblokkeerdePlaatsen}`}
                        inline={true}
                    /> : null
                }
                {markt.kiesJeKraamGeblokkeerdeData ?
                    <AlertLine
                        type="warning"
                        title="Geblokkeerde data"
                        titleSmall={true}
                        message={`Data: ${markt.kiesJeKraamGeblokkeerdeData.split(',').map(date => yyyyMmDdtoDDMMYYYY(date))}`}
                        inline={true}
                    /> : null
                }
                <h2 className="Heading Heading--intro">Lijsten per dag</h2>
                <div className="row row--responsive margin-bottom">
                    {datesThisWeek.length > 0 ?
                        <div className="col-1-2 margin-bottom">
                            <h4>Deze week</h4>
                            {datesThisWeek.map(({ date, day, month, weekDay, relativeDay }, index) => (
                                <div key={date} className="well">
                                    <strong>
                                        {relativeDay !== '' && capitalize(relativeDay) + ', '}{' '}
                                        {relativeDay !== '' ? weekDay : capitalize(weekDay)} {day} {month}
                                    </strong>
                                    {markt.kiesJeKraamFase === 'voorbereiding' ?
                                        <ul className="LinkList">
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                    {markt.kiesJeKraamFase === 'activatie' ?
                                        <ul className="LinkList">
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                                </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/voorrangslijst/`} className="Link">
                                                    Ondernemers niet ingedeeld
                                                </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                    Afmeldingen vasteplaatshouders
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                    {markt.kiesJeKraamFase === 'wenperiode' ?
                                        <ul className="LinkList">
                                            {index === 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/indeling/`} className="Link">Indeling</a>
                                                </li> : null
                                            }
                                            {index === 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/ondernemers-niet-ingedeeld/`} className="Link">Ondernemers niet ingedeeld
                                                    </a>
                                                </li> : null
                                            }
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                                </a>
                                            </li>
                                            {index === 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/voorrangslijst/`} className="Link">
                                                        Voorrangslijst
                                                </a>
                                                </li> : null}
                                            {index > 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/alle-sollicitanten/`} className="Link">
                                                        Alle sollicitanten
                                                </a>
                                                </li> : null}
                                            <li className="LinkList__item">
                                                <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                    Afmeldingen vasteplaatshouders
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                    {markt.kiesJeKraamFase === 'live' ?
                                        <ul className="LinkList">
                                            {index === 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/indeling/`} className="Link">Indeling</a>
                                                </li> : null
                                            }
                                            {index > 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                        Conceptindeling
                                                    </a>
                                                </li> : null
                                            }
                                            {index === 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/ondernemers-niet-ingedeeld/`} className="Link">Ondernemers niet ingedeeld
                                                    </a>
                                                </li> : null
                                            }
                                            {index === 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/voorrangslijst/`} className="Link">
                                                        Voorrangslijst
                                                    </a>
                                                </li> : null
                                            }
                                            {index > 0 ?
                                                <li className="LinkList__item">
                                                    <a href={`./${date}/alle-sollicitanten/`} className="Link">
                                                        Alle sollicitanten
                                                    </a>
                                                </li> : null
                                            }
                                            <li className="LinkList__item">
                                                <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                    Afmeldingen vasteplaatshouders
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                </div>
                            ))}
                        </div> : null}
                    {datesNextWeek.length > 0 ?
                        <div className="col-1-2">
                            <h4>Volgende week</h4>
                            {datesNextWeek.map(({ date, day, month, weekDay, relativeDay }, index) => (
                                <div key={date} className="well">
                                    <strong>
                                        {relativeDay !== '' && capitalize(relativeDay) + ', '}{' '}
                                        {relativeDay !== '' ? weekDay : capitalize(weekDay)} {day} {month}
                                    </strong>
                                    {markt.kiesJeKraamFase === 'voorbereiding' ?
                                        <ul className="LinkList">
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                    {markt.kiesJeKraamFase === 'activatie' ?
                                        <ul className="LinkList">
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                                </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/voorrangslijst/`} className="Link">Ondernemers niet ingedeeld
                                                </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                    Afmeldingen vasteplaatshouders
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                    {markt.kiesJeKraamFase === 'wenperiode' ?
                                        <ul className="LinkList">
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                                </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/alle-sollicitanten/`} className="Link">
                                                    Alle sollicitanten
                                                </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                    Afmeldingen vasteplaatshouders
                                                </a>
                                            </li>
                                        </ul> : null
                                    }
                                    {markt.kiesJeKraamFase === 'live' ?
                                        <ul className="LinkList">
                                            <li className="LinkList__item">
                                                <a href={`./${date}/concept-indelingslijst/`} className="Link">
                                                    Conceptindeling
                                            </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/alle-sollicitanten/`} className="Link">
                                                    Alle sollicitanten
                                            </a>
                                            </li>
                                            <li className="LinkList__item">
                                                <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                    Afmeldingen vasteplaatshouders
                                            </a>
                                            </li>
                                        </ul> : null
                                    }
                                </div>
                            ))}
                        </div> : null}
                </div>
            </MarktDetailBase>
        );
    }
}

module.exports = MarktDetailPage;

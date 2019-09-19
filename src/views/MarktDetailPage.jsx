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
} = require('../util.ts');
const React = require('react');
const PropTypes = require('prop-types');
const MarktDetailBase = require('./components/MarktDetailBase');
const today = () => new Date().toISOString().replace(/T.+/, '');
const { getUpcomingMarktDays, parseMarktDag, A_LIJST_DAYS } = require('../domain-knowledge.js');

class MarktDetailPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        user: PropTypes.object,
        type: PropTypes.string,
        datum: PropTypes.string,
    };

    render() {
        const { markt, datum, type, user } = this.props;
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

        return (
            <MarktDetailBase bodyClass="page-markt-detail" datum={datum} type={type} user={user} markt={markt}>
                <div className="row row--responsive">
                    <div className="col-1-2">
                        <h2>Aan- en afmeldingen wenperiode</h2>
                    </div>
                </div>
                <div className="row row--responsive margin-bottom">
                    <div className="col-1-2 margin-bottom">
                        <h4>Deze week</h4>
                        {dates
                            .filter(({ date }) => new Date(date) < nextVrijday)
                            .map(({ date, day, month, weekDay, relativeDay, weekDayInt }) => (
                                <div key={date} className="well">
                                    <strong>
                                        {relativeDay !== '' && capitalize(relativeDay) + ', '}{' '}
                                        {relativeDay !== '' ? weekDay : capitalize(weekDay)} {day} {month}
                                    </strong>
                                    <ul className="LinkList">
                                        <li className="LinkList__item">
                                            <a href={`./${date}/indelingslijst/?type=wenperiode`} className="Link">
                                                Indelingslijst
                                            </a>
                                        </li>
                                        <li className="LinkList__item">
                                            <a href={`./${date}/concept-indelingslijst/?type=wenperiode`} className="Link">
                                                Concept indelingslijst
                                            </a>
                                        </li>
                                        <li className="LinkList__item">
                                            <a href={`./${date}/voorrangslijst/?type=wenperiode`} className="Link">
                                                {!A_LIJST_DAYS.includes(weekDayInt)
                                                    ? `Aanmeldingen sollicitanten`
                                                    : `A- en B lijst aanmeldingen sollicitanten`}
                                            </a>
                                        </li>
                                        <li className="LinkList__item">
                                            <a href={`./${date}/afmeldingen-vasteplaatshouders/`} className="Link">
                                                Afmeldingen vasteplaatshouders
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            ))}
                    </div>
                    <div className="col-1-2">
                        <h4>Volgende week</h4>
                        {dates
                            .filter(({ date }) => new Date(date) >= nextVrijday)
                            .map(({ date, day, month, weekDay, relativeDay, weekDayInt }) => (
                                <div key={date} className="well">
                                    <strong>
                                        {relativeDay !== '' && capitalize(relativeDay) + ', '}{' '}
                                        {relativeDay !== '' ? weekDay : capitalize(weekDay)} {day} {month}
                                    </strong>
                                    <ul className="LinkList">
                                        <li className="LinkList__item">
                                            <a href={`./${date}/indelingslijst/?type=wenperiode`} className="Link">
                                                Afmeldingen vasteplaatshouders
                                            </a>
                                        </li>
                                        <li className="LinkList__item">
                                            <a href={`./${date}/voorrangslijst/?type=wenperiode`} className="Link">
                                                {!A_LIJST_DAYS.includes(weekDayInt)
                                                    ? `Aanmeldingen sollicitanten`
                                                    : `A- en B lijst aanmeldingen sollicitanten`}
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            ))}
                    </div>
                </div>

                {/*
                <div className="row row--responsive margin-bottom">
                    <div className="col-1-2">
                        <h4>Vandaag</h4>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a href={`./${today()}/indelingslijst/?type=wenperiode`} className="Link">
                                    Afmeldingen vasteplaatshouders
                                </a>
                            </li>
                            <li className="LinkList__item">
                                <a href={`./${today()}/voorrangslijst/?type=wenperiode`} className="Link">
                                    Aanmeldingen sollicitanten
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-1-2">
                        <h4>Morgen</h4>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a href={`./${addDays(today(), 1)}/indelingslijst/?type=wenperiode`} className="Link">
                                    Afmeldingen vasteplaatshouders
                                </a>
                            </li>
                            <li className="LinkList__item">
                                <a href={`./${addDays(today(), 1)}/voorrangslijst/?type=wenperiode`} className="Link">
                                    Aanmeldingen sollicitanten
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="row row--responsive">
                    <div className="col-1-2">
                        <h2>Indelingslijsten</h2>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a className={`Link`} href={`./${today()}/indelingslijst/`}>
                                    <strong>Vandaag</strong>,{formatDayOfWeek(new Date(today()))}{' '}
                                    {new Date(today()).getDate()} {formatMonth(today())}
                                </a>
                            </li>
                            <li className="LinkList__item">
                                <a className={`Link`} href={`./${addDays(today(), 1)}/indelingslijst/`}>
                                    <strong>Morgen</strong>,{formatDayOfWeek(new Date(addDays(today(), 1)))}{' '}
                                    {new Date(addDays(today(), 1)).getDate()} {formatMonth(addDays(today(), 1))}
                                </a>
                            </li>
                        </ul>
                        <p>Concept-indelingslijsten:</p>
                        <ul className="LinkList">
                            {dates.map(({ date, day, month, weekDay, relativeDay }) => (
                                <li key={date} className="LinkList__item">
                                    <a className={`Link`} href={`./${date}/concept-indelingslijst/`}>
                                        <strong>{relativeDay !== '' && capitalize(relativeDay) + ', '}</strong>
                                        {relativeDay !== '' ? weekDay : capitalize(weekDay)} {day} {month}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-1-2">
                        <h2>Ondernemers</h2>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a href={`./${today()}/vasteplaatshouders/`} className="Link">
                                    Vasteplaatshouder
                                </a>
                            </li>
                        </ul>
                        <h2>Aanwezigheid vandaag</h2>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a href={`./${today()}/sollicitanten/`} className="Link">
                                    Sollicitanten, VKK en TVPL
                                </a>
                            </li>
                            <li className="LinkList__item">
                                <a href={`./${today()}/voorrangslijst/`} className="Link">
                                    Voorrangslijst
                                </a>
                            </li>
                        </ul>
                        <h2>Aanwezigheid morgen</h2>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a href={`./${addDays(today(), 1)}/sollicitanten/`} className="Link">
                                    Sollicitanten, VKK en TVPL
                                </a>
                            </li>
                            <li className="LinkList__item">
                                <a href={`./${addDays(today(), 1)}/voorrangslijst/`} className="Link">
                                    Voorrangslijst
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                    */}
            </MarktDetailBase>
        );
    }
}

module.exports = MarktDetailPage;

const {
    addDays,
    DAYS_IN_WEEK,
    formatDayOfWeek,
    formatMonth,
    nextWeek,
    capitalize,
    relativeHumanDay,
} = require('../util.js');
const React = require('react');
const PropTypes = require('prop-types');
const MarktDetailBase = require('./components/MarktDetailBase');
const today = () => new Date().toISOString().replace(/T.+/, '');
const { getUpcomingMarktDays, parseMarktDag } = require('../domain-knowledge.js');

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
        const endDate = nextWeek();
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
                };
            },
        );

        return (
            <MarktDetailBase bodyClass="page-markt-detail" datum={datum} type={type} user={user} markt={markt}>
                <div className="row row--responsive">
                    <div className="col-1-2">
                        <h2>Indelingslijsten</h2>
                        <ul className="LinkList">
                            {dates.map(({ date, day, month, weekDay, relativeDay }) => (
                                <li key={date} className="LinkList__item">
                                    <a className={`Link`} href={`/markt/${markt.id}/${date}/indelingslijst/`}>
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
                                <a href={`/markt/${markt.id}/${today()}/vasteplaatshouders/`} className="Link">
                                    Vasteplaatshouder
                                </a>
                            </li>
                        </ul>
                        <h2>Aanwezigheid vandaag</h2>
                        <ul className="LinkList">
                            <li className="LinkList__item">
                                <a href={`/markt/${markt.id}/${today()}/sollicitanten/`} className="Link">
                                    Sollicitanten & vastekaarthouders
                                </a>
                            </li>
                            <li className="LinkList__item">
                                <a href={`./${today()}/voorrangslijst/`} className="Link">
                                    Voorrangslijst
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </MarktDetailBase>
        );
    }
}

module.exports = MarktDetailPage;

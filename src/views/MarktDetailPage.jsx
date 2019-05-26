import { addDays, DAYS_IN_WEEK, formatDayOfWeek, formatMonth, nextWeek, tomorrow } from '../util.js';
const React = require('react');
const PropTypes = require('prop-types');
const MarktDetailBase = require('./components/MarktDetailBase');
const today = () => new Date().toISOString().replace(/T.+/, '');
import { getUpcomingMarktDays, parseMarktDag } from '../domain-knowledge.js';

class MarktDetailPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
    };

    render() {
        const { markt } = this.props;
        const startDate = addDays(today(), -1);
        const endDate = nextWeek();
        const marktDagen = (markt.marktDagen || []).map(parseMarktDag);
        const relativeDays = ['Vandaag', 'Morgen'];
        const dates = getUpcomingMarktDays(startDate, endDate, (markt.marktDagen || []).map(parseMarktDag)).map(
            (d, i) => {
                return {
                    relativeDay: relativeDays[i],
                    date: d,
                    day: new Date(d).getDate(),
                    month: formatMonth(d),
                    weekDay: formatDayOfWeek(new Date(d)),
                    marktDag: marktDagen[new Date(d).getDay()],
                };
            },
        );

        return (
            <MarktDetailBase bodyClass="page-markt-detail" title={markt.naam}>
                <div className="row">
                    {console.log(markt)}
                    <div className="col-1-2">
                        <h2>Indelingslijsten</h2>
                        <ul className="LinkList">
                            {dates.map(({ date, day, month, weekDay, relativeDay }) => (
                                <li key={date}>
                                    <a className={`Link`} href={`/markt/${markt.id}/${date}/indelingslijst/`}>
                                        <strong>{relativeDay && relativeDay + ', '}</strong>
                                        {weekDay} {day} {month}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-1-2">
                        <h2>Ondernemers</h2>
                        <ul className="LinkList">
                            <li>
                                <a href={`/markt/${markt.id}/${today()}/vasteplaatshouders/`} className="Link">
                                    Vasteplaatshouder
                                </a>
                            </li>
                            <li>
                                <a href={`/markt/${markt.id}/${today()}/sollicitanten/`} className="Link">
                                    Sollicitanten
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

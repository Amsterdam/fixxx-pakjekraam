const React = require('react');
const Page = require('./Page.jsx');
const { formatDayOfWeek } = require('../../util.js');

const getUpcomingMarktDays = () => {
    const DAYS_IN_WEEK = 7;

    const dates = [];

    for (let i = 1, l = DAYS_IN_WEEK; i <= l; i++) {
        const date = new Date();

        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().replace(/T.+/, ''));
    }

    return dates;
};

class AanmeldForm extends React.Component {
    render() {
        return (
            <form method="POST" action="/afmelden/">
                <h1>Afmelden door vasteplekhouders</h1>
                <p>
                    <label htmlFor="username">Erkenningsnummer:</label>
                    <input id="username" name="username" />
                </p>
                <ul>
                    {getUpcomingMarktDays().map(date => (
                        <li key={date}>
                            <input
                                id={`aanmelding-${date}`}
                                name="aanmelding[]"
                                type="checkbox"
                                value={date}
                                checked="checked"
                            />
                            <label htmlFor={`aanmelding-${date}`}>
                                Ik kom op {formatDayOfWeek(date)} {date}
                            </label>
                        </li>
                    ))}
                </ul>
                <p>
                    <input type="submit" />
                </p>
            </form>
        );
    }
}

module.exports = AanmeldForm;

const React = require('react');
const Page = require('./Page.jsx');
const { formatDayOfWeek } = require('../../util.js');

const tomorrow = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);

    return date.toISOString().replace(/T.+/, '');
};

class AanmeldForm extends React.Component {
    render() {
        return (
            <form method="POST" action="/aanmelden/">
                <h1>Aanmelden voor sollicitanten</h1>
                <p>
                    <label htmlFor="erkenningsnummer">Erkenningsnummer:</label>
                    <input id="erkenningsnummer" name="erkenningsNummer" />
                </p>
                <p>
                    <label htmlFor="marktId">Markt:</label>
                    <select name="marktId" id="marktId">
                        <option value="19">Albert Cuyp</option>
                    </select>
                </p>
                <p>
                    <input id="aanmelding[]" name="aanmelding" type="checkbox" value={tomorrow()} />
                    <label htmlFor="aanmelding[]">
                        Ik kom morgen ({formatDayOfWeek(tomorrow())} {tomorrow()})
                    </label>
                </p>
                <p>
                    <input type="submit" />
                </p>
            </form>
        );
    }
}

module.exports = AanmeldForm;

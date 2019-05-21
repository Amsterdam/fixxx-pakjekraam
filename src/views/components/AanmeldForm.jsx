const React = require('react');
const Page = require('./Page.jsx');
const PropTypes = require('prop-types');
const { formatDayOfWeek } = require('../../util.js');

class AanmeldForm extends React.Component {
    propTypes = {
        date: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        aanmeldingen: PropTypes.array,
    };

    render() {
        const { aanmeldingen, date, ondernemer } = this.props;
        const rsvp = (aanmeldingen || []).find(a => a.marktDate === date);
        const marktId = rsvp ? rsvp.marktId : '';
        const checked = !!rsvp;
        const noMarkt = {
            id: '',
            naam: '',
        };
        const markten = [
            noMarkt,
            ...ondernemer.sollicitaties
                .filter(sollicitatie => !sollicitatie.doorgehaald)
                .map(sollicitatie => sollicitatie.markt),
        ].map(markt => ({ ...markt, selected: markt.id === marktId }));

        return (
            <form method="POST" action="/aanmelden/">
                <h1>Aanmelden voor sollicitanten</h1>
                <p>
                    <label htmlFor="erkenningsnummer">Erkenningsnummer:</label>
                    <input id="erkenningsnummer" name="erkenningsNummer" defaultValue={ondernemer.erkenningsnummer} />
                </p>
                <p>
                    <label htmlFor="marktId">Markt:</label>
                    <select name="marktId" id="marktId">
                        {markten.map(markt => (
                            <option key={markt.id} value={`${markt.id}`} selected={markt.selected}>
                                {markt.naam}
                            </option>
                        ))}
                    </select>
                </p>
                <p>
                    <input
                        id="aanmelding[]"
                        name="aanmelding"
                        type="checkbox"
                        defaultValue={date}
                        defaultChecked={checked}
                    />
                    <label htmlFor="aanmelding[]">
                        Ik kom morgen ({formatDayOfWeek(date)} {date})
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

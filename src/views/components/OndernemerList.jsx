const PropTypes = require('prop-types');
const React = require('react');

const today = () => new Date().toISOString().replace(/T.+/, '');

const OndernemerList = ({ ondernemers, markt, aanmeldingen }) => {
    return (
        <div className="OndernemerList">
            <table className="OndernemerList__table">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Sollicitant</th>
                        <th>Status</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {ondernemers.map(ondernemer => {
                        const aanmelding =
                            ondernemer &&
                            aanmeldingen.find(rsvp => rsvp.erkenningsNummer === ondernemer.koopman.erkenningsnummer);

                        return (
                            <tr key={ondernemer.koopman.erkenningsnummer}>
                                <td>
                                    <strong>
                                        <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                                        <a href={`/profile/${ondernemer.koopman.erkenningsnummer}`}>
                                            {ondernemer.sollicitatieNummer}
                                        </a>
                                    </strong>
                                </td>
                                <td>
                                    {ondernemer.koopman.voorletters && ondernemer.koopman.voorletters + ' '}
                                    {ondernemer.koopman.achternaam}
                                </td>
                                <td>{ondernemer.status}</td>
                                <td
                                    className={`${
                                        aanmelding && aanmelding.attending === false
                                            ? 'OndernemerList__ondernemer--not-attending'
                                            : ''
                                    } ${aanmelding ? 'OndernemerList__ondernemer--attending' : ''}`}
                                />
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

OndernemerList.propTypes = {
    ondernemers: PropTypes.arrayOf(PropTypes.object),
    markt: PropTypes.object,
    aanmeldingen: PropTypes.object,
};

module.exports = OndernemerList;

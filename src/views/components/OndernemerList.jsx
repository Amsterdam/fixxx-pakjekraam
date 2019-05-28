import PropTypes from 'prop-types';
import React from 'react';

const today = () => new Date().toISOString().replace(/T.+/, '');

const OndernemerList = ({ ondernemers, markt, aanmeldingen }) => {
    return (
        <div className="OndernemerList">
            <table className="OndernemerList__table">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Sollicitant</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {ondernemers.map(ondernemer => {
                        const aanmelding =
                            ondernemer &&
                            aanmeldingen.find(
                                rsvp => rsvp.dataValues.erkenningsNummer === ondernemer.koopman.erkenningsnummer,
                            );

                        return (
                            <tr key={ondernemer.koopman.erkenningsnummer}>
                                <td>
                                    <strong>
                                        <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                                        <a href={`/aanmelden/${ondernemer.koopman.erkenningsnummer}/${markt.id}`}>
                                            {ondernemer.sollicitatieNummer}
                                        </a>
                                    </strong>
                                </td>
                                <td>{ondernemer.koopman.achternaam}</td>
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

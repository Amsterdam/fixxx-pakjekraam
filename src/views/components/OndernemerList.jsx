import PropTypes from 'prop-types';
import React from 'react';
const today = () => new Date().toISOString().replace(/T.+/, '');

const OndernemerList = ({ ondernemers, markt }) => {
    return (
        <div>
            <ul className="LinkList">
                {ondernemers.map(ondernemer => (
                    <li key={ondernemer.koopman.erkenningsnummer} className="LinkList__item">
                        <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                        <a href={`/aanmelden/${ondernemer.koopman.erkenningsnummer}/${markt.id}`} className="Link">
                            <strong>{ondernemer.sollicitatieNummer}</strong>:&nbsp;
                            {ondernemer.koopman.achternaam}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

OndernemerList.propTypes = {
    ondernemers: PropTypes.arrayOf(PropTypes.object),
    markt: PropTypes.object,
};

module.exports = OndernemerList;

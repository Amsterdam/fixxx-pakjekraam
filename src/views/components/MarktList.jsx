import PropTypes from 'prop-types';
import React from 'react';
const today = () => new Date().toISOString().replace(/T.+/, '');

const MarktList = ({ markten }) => {
    return (
        <div>
            <ul>
                {markten.map(markt => (
                    <li key={markt.id}>
                        <a href={`/markt-indeling/${markt.id}/${today()}/looplijst/`}>{markt.naam}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

MarktList.propTypes = {
    markten: PropTypes.arrayOf(PropTypes.object),
};

module.exports = MarktList;

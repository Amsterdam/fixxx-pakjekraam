import PropTypes from 'prop-types';
import React from 'react';
const today = () => new Date().toISOString().replace(/T.+/, '');

const MarktList = ({ markten }) => {
    return (
        <div>
            <ul className="LinkList">
                {markten.map(markt => (
                    <li key={markt.id} className="LinkList__item">
                        <a href={`/markt-indeling/${markt.id}/${today()}/indelingslijst/`} className="Link">
                            {markt.naam}
                        </a>
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

import IndelingslijstPage from './IndelingslijstPage';
import PropTypes from 'prop-types';
import React from 'react';

const Indelingslijst = ({ data, markt }) => {
    return (
        <div className="Indelingslijst" data-handler="scroll-to" data-listen="sollicitatieNummer">
            <div className="indelingslijst-wrapper">
                {data.paginas.map((p, i) => {
                    return <IndelingslijstPage key={i} page={p} index={i} data={data} markt={markt} />;
                })}
            </div>
        </div>
    );
};

Indelingslijst.propTypes = {
    data: PropTypes.object,
    markt: PropTypes.object,
};

module.exports = Indelingslijst;

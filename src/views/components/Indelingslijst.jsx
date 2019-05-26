import IndelingslijstPage from './IndelingslijstPage';
import PropTypes from 'prop-types';
import React from 'react';

const Indelingslijst = ({ data, markt, type, datum }) => {
    return (
        <div className="Indelingslijst" data-handler="scroll-to" data-listen="sollicitatieNummer">
            <div className="indelingslijst-wrapper">
                {data.paginas.map((p, i) => {
                    return (
                        <IndelingslijstPage
                            key={i}
                            page={p}
                            index={i}
                            data={data}
                            markt={markt}
                            datum={datum}
                            type={type}
                        />
                    );
                })}
            </div>
        </div>
    );
};

Indelingslijst.propTypes = {
    data: PropTypes.object,
    markt: PropTypes.object,
    type: PropTypes.string,
    datum: PropTypes.string,
};

module.exports = Indelingslijst;

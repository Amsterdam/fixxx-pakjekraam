import PropTypes from "prop-types";
import React from 'react';
import LooplijstPage from './LooplijstPage';

const Looplijst = ({ data, markt }) => {
    return (
        <div className="Looplijst">
            <div className="looplijst-wrapper">
            {
                data.paginas.map((p, i) => {
                    return (
                        <LooplijstPage key={i} page={p} index={i} data={data} markt={markt}/>
                    );
                })
            }
            </div>
        </div>
    );
};

Looplijst.propTypes = {
  data: PropTypes.object,
  markt: PropTypes.object
};

module.exports = Looplijst;

import PropTypes from "prop-types";
import React from 'react';
import LooplijstPage from './LooplijstPage';

const Looplijst = ({ data }) => {
    return (
        <div className="Looplijst">
            {
                data.paginas.map((p, i) => {
                    return (
                        <LooplijstPage key={i} page={p} index={i} data={data}/>
                    );
                })
            }
        </div>
    );
};

Looplijst.propTypes = {
  data: PropTypes.object
};

module.exports = Looplijst;

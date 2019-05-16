import PropTypes from 'prop-types';
import React from 'react';

const PrintableBackground = ({ color }) => {
    return (
        <svg className="PrintableBackground">
            <rect fill={color} x="0" y="0" width="100%" height="100%"/>
        </svg>
    );
};

PrintableBackground.propTypes = {
    color: PropTypes.string,
};

module.exports = PrintableBackground;

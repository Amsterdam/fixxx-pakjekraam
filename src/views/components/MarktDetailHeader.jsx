import PropTypes from 'prop-types';
import React from 'react';

const MarktDetailHeader = ({ children }) => {
    return (
        <div className="MarktDetailHeader container">
            <div className="MarktDetailHeader__wrapper container__content">{children}</div>
        </div>
    );
};

MarktDetailHeader.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = MarktDetailHeader;

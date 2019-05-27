import PropTypes from 'prop-types';
import React from 'react';

const PrintPageHeader = ({ children }) => {
    return <div className="PrintPageHeader">{children}</div>;
};

PrintPageHeader.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = PrintPageHeader;

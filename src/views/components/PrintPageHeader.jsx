const PropTypes = require('prop-types');
const React = require('react');

const PrintPageHeader = ({ children }) => {
    return <div className="PrintPageHeader">{children}</div>;
};

PrintPageHeader.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = PrintPageHeader;

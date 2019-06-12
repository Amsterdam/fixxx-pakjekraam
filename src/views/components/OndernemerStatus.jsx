const PropTypes = require('prop-types');
const React = require('react');

const OndernemerStatus = ({ status, size }) => {
    return (
        <span className={`OndernemerStatus OndernemerStatus--${status} OndernemerStatus--size-${size}`}>{status}</span>
    );
};

OndernemerStatus.propTypes = {
    status: PropTypes.string.isRequired,
    size: PropTypes.string,
};

module.exports = OndernemerStatus;

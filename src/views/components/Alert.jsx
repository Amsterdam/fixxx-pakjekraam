import PropTypes from 'prop-types';
import React from 'react';

const Alert = ({ type, message, title }) => {
    return (
        <div className={'Alert Alert--' + type}>
            <span className="Alert__icon" />
            {title && <h4 className="Alert__message">{title}</h4>}
            <span className="Alert__message">{message}</span>
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['error', 'warning', 'notification']),
    message: PropTypes.string,
    title: PropTypes.string,
};

module.exports = Alert;

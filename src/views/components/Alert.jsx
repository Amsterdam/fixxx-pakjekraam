const PropTypes = require('prop-types');
const React = require('react');

const Alert = ({ type, message, title }) => {
    return (
        <div className={'Alert Alert--' + type}>
            <span className="Alert__icon" />
            {title && <h4 className="Alert__title">{title}</h4>}
            <span className="Alert__message">{message}</span>
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['error', 'warning', 'success']),
    message: PropTypes.string,
    title: PropTypes.string,
};

module.exports = Alert;

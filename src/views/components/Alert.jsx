const PropTypes = require('prop-types');
const React = require('react');

const Alert = ({ type, message, title, inline, children }) => {
    const innerMessage = message ? message : children;
    return (
        <div className={`Alert Alert--${type} ${inline ? `Alert--inline` : ``}`}>
            <span className="Alert__icon" />
            {title && <h4 className="Alert__title">{title}</h4>}
            <span className="Alert__message" dangerouslySetInnerHTML={{ __html: innerMessage }} ></span>
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.string,
    children: PropTypes.optionalNode,
    message: PropTypes.string,
    title: PropTypes.string,
    inline: PropTypes.bool,
};

module.exports = Alert;

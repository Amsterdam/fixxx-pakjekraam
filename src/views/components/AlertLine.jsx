const PropTypes = require('prop-types');
const React = require('react');

const AlertLine = ({ type, message, title, children, titleSmall }) => {
    return (
        <div className={`AlertLine AlertLine--${type} ${titleSmall ? `AlertLine--title-small` : ``}`}>
            {title && <h4 className="AlertLine__title">{title}</h4>}
            <span className="AlertLine__message">{message ? message : children}</span>
        </div>
    );
};

AlertLine.propTypes = {
    type: PropTypes.string,
    children: PropTypes.optionalNode,
    message: PropTypes.string,
    title: PropTypes.string,
    inline: PropTypes.bool,
    titleSmall: PropTypes.bool,
};

module.exports = AlertLine;

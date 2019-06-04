const PropTypes = require('prop-types');
const React = require('react');

const Street = ({ title }) => {
    return (
        <h3 className="Street">
            <span className="Street__title">{title}</span>
        </h3>
    );
};

Street.propTypes = {
    title: PropTypes.string,
};

module.exports = Street;

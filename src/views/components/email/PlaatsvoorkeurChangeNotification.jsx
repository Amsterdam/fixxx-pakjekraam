const PropTypes = require('prop-types');
const React = require('react');

const PlaatsvoorkeurChangeNotification = ({ children }) => {
    return (
        <main className="content container">
            <div className="container__content">{children}</div>
        </main>
    );
};

PlaatsvoorkeurChangeNotification.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = PlaatsvoorkeurChangeNotification;

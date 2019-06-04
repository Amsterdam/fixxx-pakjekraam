const PropTypes = require('prop-types');
const React = require('react');

const OndernemerMarktHeading = ({ markt, sollicitatie }) => {
    return (
        <h2 className="OndernemerMarktHeading" id={`markt-${markt.id}`}>
            {markt.naam} ({sollicitatie.status}, {sollicitatie.sollicitatieNummer})
        </h2>
    );
};

OndernemerMarktHeading.propTypes = {
    sollicitatie: PropTypes.object.isRequired,
    markt: PropTypes.object.isRequired,
};

module.exports = OndernemerMarktHeading;

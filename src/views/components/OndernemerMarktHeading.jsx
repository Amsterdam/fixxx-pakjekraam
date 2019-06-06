const PropTypes = require('prop-types');
const React = require('react');

const OndernemerMarktHeading = ({ markt, sollicitatie }) => {
    return (
        <h2 className="OndernemerMarktHeading" id={`markt-${markt.id}`}>
            {markt.naam}
            <span className="Pil">{sollicitatie.status}</span>
            <span className="Pil">{sollicitatie.sollicitatieNummer}</span>
        </h2>
    );
};

OndernemerMarktHeading.propTypes = {
    sollicitatie: PropTypes.object.isRequired,
    markt: PropTypes.object.isRequired,
};

module.exports = OndernemerMarktHeading;

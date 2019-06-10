const PropTypes = require('prop-types');
const React = require('react');

const OndernemerMarktHeading = ({ markt, sollicitatie }) => {
    return (
        <h2 className="OndernemerMarktHeading" id={`markt-${markt.id}`}>
            <span className="OndernemerMarktHeading__markt-naam">{markt.naam}</span>
            <span className="Pil">{sollicitatie.status}</span>
            <span className="Pil">sollnr. {sollicitatie.sollicitatieNummer}</span>
            <span className="Pil">
                plaats{sollicitatie.vastePlaatsen.length > 1 ? `en` : ``} {sollicitatie.vastePlaatsen.join(', ')}
            </span>
        </h2>
    );
};

OndernemerMarktHeading.propTypes = {
    sollicitatie: PropTypes.object.isRequired,
    markt: PropTypes.object.isRequired,
};

module.exports = OndernemerMarktHeading;

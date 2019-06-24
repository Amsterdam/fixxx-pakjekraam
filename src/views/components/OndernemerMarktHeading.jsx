const PropTypes = require('prop-types');
const React = require('react');

const OndernemerMarktHeading = ({ markt, sollicitatie }) => {
    return (
        <h2 className="OndernemerMarktHeading" id={`markt-${markt.id}`}>
            <span className="OndernemerMarktHeading__markt-naam">{markt.naam}</span>
            {['soll', 'vpl', 'vkk', 'overig'].includes(sollicitatie.status) ? (
                <span className={`Pil Pil--${sollicitatie.status}`}>{sollicitatie.status}</span>
            ) : null}
            <span className="Pil">sollnr. {sollicitatie.sollicitatieNummer}</span>
            {sollicitatie.status === 'vpl' ? (
                <span className="Pil">
                    plaats{sollicitatie.vastePlaatsen.length > 1 ? `en` : ``} {sollicitatie.vastePlaatsen.join(', ')}
                </span>
            ) : null}
        </h2>
    );
};

OndernemerMarktHeading.propTypes = {
    sollicitatie: PropTypes.object.isRequired,
    markt: PropTypes.object.isRequired,
};

module.exports = OndernemerMarktHeading;

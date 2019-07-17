const PropTypes = require('prop-types');
const React = require('react');
const Button = require('./Button');

const OndernemerMarktTile = ({ markt, sollicitatie, voorkeuren, indelingVoorkeuren, aanmeldingen }) => {
    return (
        <div className="OndernemerMarktTile well background-link-parent">
            <h2>{markt.naam}</h2>
            <a className="background-link" href={`/markt-detail/${markt.id}`} />
            <Button label={`Ga naar ${markt.naam}`} href={`/markt-detail/${markt.id}`} />
        </div>
    );
};

OndernemerMarktTile.propTypes = {
    markt: PropTypes.object.isRequired,
    sollicitatie: PropTypes.object,
    voorkeuren: PropTypes.object,
    indelingVoorkeuren: PropTypes.object,
    aanmeldingen: PropTypes.object,
};

module.exports = OndernemerMarktTile;

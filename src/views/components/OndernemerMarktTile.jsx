const PropTypes = require('prop-types');
const React = require('react');
const Button = require('./Button');
const AlertLine = require('./AlertLine');
const Uitslag = require('./Uitslag.jsx');

const OndernemerMarktTile = ({
    markt,
    aanmeldingVandaag,
    aanmeldingMorgen,
    toewijzingVandaag,
    toewijzingMorgen,
    geopend,
    today,
    tomorrow,
    eggie,
}) => {
    return (
        <div className="OndernemerMarktTile well background-link-parent">
            <h2>{markt.naam}</h2>
            <a className="background-link" href={`/markt-detail/${markt.id}`} />
            <Button label={`Ga naar ${markt.naam}`} href={`/markt-detail/${markt.id}`} />
            <Uitslag time={new Date()} today={today} tomorrow={tomorrow} eggie={eggie} toewijzingVandaag={toewijzingVandaag} toewijzingMorgen={toewijzingMorgen} aanmeldingVandaag={aanmeldingVandaag} aanmeldingMorgen={aanmeldingMorgen}/>
        </div>
    );
};
OndernemerMarktTile.propTypes = {
    markt: PropTypes.object.isRequired,
    aanmeldingVandaag: PropTypes.object,
    aanmeldingMorgen: PropTypes.object,
    toewijzingVandaag: PropTypes.object,
    toewijzingMorgen: PropTypes.object,
    sollicitatie: PropTypes.object,
    voorkeuren: PropTypes.object,
    indelingVoorkeuren: PropTypes.object,
    aanmeldingen: PropTypes.object,
    geopend: PropTypes.bool,
    eggie: PropTypes.bool,
    today: PropTypes.string,
    tomorrow: PropTypes.string,
};
module.exports = OndernemerMarktTile;

const PropTypes = require('prop-types');
const React = require('react');
const Button = require('./Button');
const AlertLine = require('./AlertLine');

const OndernemerMarktTile = ({
    markt,
    aanmeldingVandaag,
    aanmeldingMorgen,
    toewijzingVandaag,
    toewijzingMorgen,
    time,
    geopend,
    eggie,
}) => {
    return (
        <div className="OndernemerMarktTile well background-link-parent">
            <h2>{markt.naam}</h2>
            <a className="background-link" href={`/markt-detail/${markt.id}`} />
            <Button label={`Ga naar ${markt.naam}`} href={`/markt-detail/${markt.id}`} />
            {time.getHours() > 21 && time.getHours() < 24 && geopend ? (
                <div className="OndernemerMarktTile__update-row">
                    <h4 className="OndernemerMarktTile__update-row__heading">
                        Morgen ({aanmeldingMorgen.marktDate})
                        {aanmeldingMorgen.attending ? (
                            <span className="OndernemerMarktTile__update-row__status OndernemerMarktTile__update-row__status--aangemeld">
                                {' '}
                                aangemeld
                            </span>
                        ) : (
                            <span className="OndernemerMarktTile__update-row__status OndernemerMarktTile__update-row__status--niet-aangemeld">
                                {' '}
                                niet aangemeld
                            </span>
                        )}
                    </h4>
                    {!toewijzingMorgen && eggie ? (
                        <AlertLine
                            type="success"
                            title="Ingedeeld"
                            titleSmall={true}
                            message={`Jouw plekken: ${toewijzingMorgen.plaatsen.join(', ')}`}
                            inline={true}
                        />
                    ) : eggie ? (
                        <span> geen toewijzing </span>
                    ) : null}
                </div>
            ) : null}
            {time.getHours() >= 0 && time.getHours() < 18 && geopend && aanmeldingVandaag ? (
                <div className="OndernemerMarktTile__update-row">
                    <h4 className="OndernemerMarktTile__update-row__heading">
                        Vandaag ({aanmeldingMorgen.marktDate})
                        {aanmeldingVandaag.attending ? (
                            <span className="OndernemerMarktTile__update-row__status OndernemerMarktTile__update-row__status--aangemeld">
                                {' '}
                                aangemeld
                            </span>
                        ) : (
                            <span className="OndernemerMarktTile__update-row__status OndernemerMarktTile__update-row__status--niet-aangemeld">
                                {' '}
                                niet aangemeld
                            </span>
                        )}
                    </h4>
                    {toewijzingVandaag && eggie ? (
                        <AlertLine
                            type="success"
                            title="Ingedeeld"
                            titleSmall={true}
                            message={`Jouw plekken: ${toewijzingVandaag.plaatsen.join(', ')}`}
                            inline={true}
                        />
                    ) : eggie ? (
                        <span>Geen toewijzing </span>
                    ) : null}
                </div>
            ) : null}
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
    time: PropTypes.instanceOf(Date),
    indelingVoorkeuren: PropTypes.object,
    aanmeldingen: PropTypes.object,
    geopend: PropTypes.bool,
    eggie: PropTypes.bool,
};
module.exports = OndernemerMarktTile;

const PropTypes = require('prop-types');
const React = require('react');
const AlertLine = require('./AlertLine');

const Content = ({ time, eggie, today, tomorrow, aanmeldingVandaag, aanmeldingMorgen, toewijzingVandaag, toewijzingMorgen }) => {
    return (
        <div>
            {time.getHours() > 21 && time.getHours() < 24 ? (
                <div className="OndernemerMarktTile__update-row">
                    <h4 className="OndernemerMarktTile__update-row__heading">
                        Morgen ({tomorrow})
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
            {time.getHours() >= 0 && time.getHours() < 18 && aanmeldingVandaag ? (
                <div className="OndernemerMarktTile__update-row">
                    <h4 className="OndernemerMarktTile__update-row__heading">
                        Vandaag ({today})
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

Content.propTypes = {
    time: PropTypes.instanceOf(Date),
    eggie: PropTypes.bool,
    today: PropTypes.string,
    tomorrow: PropTypes.string,
    aanmeldingVandaag: PropTypes.object,
    aanmeldingMorgen: PropTypes.object,
    toewijzingVandaag: PropTypes.object,
    toewijzingMorgen: PropTypes.object,
};

module.exports = Content;

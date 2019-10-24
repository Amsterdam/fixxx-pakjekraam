const PropTypes = require('prop-types');
const React = require('react');
const AlertLine = require('./AlertLine');
const { formatDate } = require('../../util.ts');

const Content = ({ time, markt, today, tomorrow, aanmeldingVandaag, aanmeldingMorgen, toewijzingVandaag, toewijzingMorgen }) => {
    function plaatsenDuiding(plaatsen) {
        if (plaatsen.length == 1) {
            return `Plaats: ${plaatsen.join(', ')}`;
        } else {
            return `Plaatsen: ${plaatsen.join(', ')}`;
        }
    }

    return (
        <div>
            {time.getHours() > 21 && time.getHours() < 24 ? (
                <div className="OndernemerMarktTile__update-row">
                    <h4 className="OndernemerMarktTile__update-row__heading">
                        Morgen ({formatDate(tomorrow)})
                        {aanmeldingMorgen.attending ? (
                            <span className="OndernemerMarktTile__update-row__status OndernemerMarktTile__update-row__status--aangemeld">aangemeld</span>
                        ) : (
                            <span className="OndernemerMarktTile__update-row__status OndernemerMarktTile__update-row__status--niet-aangemeld">niet aangemeld</span>
                        )}
                    </h4>
                    {!toewijzingMorgen && markt.fase === 'live' ? (
                        <AlertLine
                            type="success"
                            title="Ingedeeld"
                            titleSmall={true}
                            message={plaatsenDuiding(toewijzingMorgen.plaatsen)}
                            inline={true}
                        />
                    ) : markt.fase === 'live' ? (
                        <span> geen toewijzing </span>
                    ) : null}
                </div>
            ) : null}
            {time.getHours() >= 0 && time.getHours() < 18 && aanmeldingVandaag ? (
                <div className="OndernemerMarktTile__update-row">
                    <h4 className="OndernemerMarktTile__update-row__heading">
                        Vandaag ({formatDate(today)})
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
                    {toewijzingVandaag && markt.fase === 'live' ? (
                        <AlertLine
                            type="success"
                            title="Ingedeeld"
                            titleSmall={true}
                            message={ plaatsenDuiding(toewijzingVandaag.plaatsen) }
                            inline={true}
                        />
                    ) : markt.fase === 'live' ? (
                        <span>Geen toewijzing </span>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

Content.propTypes = {
    time: PropTypes.instanceOf(Date),
    today: PropTypes.string,
    tomorrow: PropTypes.string,
    markt: PropTypes.object,
    aanmeldingVandaag: PropTypes.object,
    aanmeldingMorgen: PropTypes.object,
    toewijzingVandaag: PropTypes.object,
    toewijzingMorgen: PropTypes.object,
};

module.exports = Content;

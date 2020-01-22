const PropTypes = require('prop-types');
const React = require('react');
const UitslagTile = require('./UitslagTile');
const { getMaDiWoDo } = require('../../util.ts');

const Component = ({ markt, today, tomorrow, aanmeldingVandaag, aanmeldingMorgen, toewijzingVandaag, toewijzingMorgen, ondernemer, afwijzingVandaag, afwijzingMorgen, daysClosed }) => {
    const sollicitatie = ondernemer.sollicitaties.find(sollicitatieOndernemer => {
        return sollicitatieOndernemer.markt.id == markt.id && !sollicitatieOndernemer.doorgehaald;
    });

    const openToday = markt.marktDagen.includes(getMaDiWoDo( new Date(today) ));
    const openTomorrow = markt.marktDagen.includes(getMaDiWoDo( new Date(tomorrow) ));

    return (
        <div className="row row--responsive">
            {markt.kiesJeKraamFase !== 'activatie' || markt.kiesJeKraamFase === 'wenperiode' || markt.kiesJeKraamFase === 'live' ?
                <UitslagTile
                    title={"Vandaag"}
                    markt={markt}
                    open={openToday}
                    date={today}
                    sollicitatie={sollicitatie}
                    aanmelding={aanmeldingVandaag}
                    toewijzing={toewijzingVandaag}
                    afwijzing={afwijzingVandaag}
                    daysClosed={daysClosed}
                /> : null}
            {markt.kiesJeKraamFase !== 'activatie' || markt.kiesJeKraamFase === 'wenperiode' || markt.kiesJeKraamFase === 'live' ?
                <UitslagTile
                    title={"Morgen"}
                    markt={markt}
                    open={false}
                    date={tomorrow}
                    sollicitatie={sollicitatie}
                    aanmelding={aanmeldingMorgen}
                    toewijzing={toewijzingMorgen}
                    afwijzing={afwijzingMorgen}
                    daysClosed={daysClosed}
                /> : null}
        </div>
    );
};

Component.propTypes = {
    today: PropTypes.string,
    tomorrow: PropTypes.string,
    markt: PropTypes.object,
    ondernemer: PropTypes.object,
    aanmeldingVandaag: PropTypes.object,
    aanmeldingMorgen: PropTypes.object,
    toewijzingVandaag: PropTypes.object,
    toewijzingMorgen: PropTypes.object,
    afwijzingVandaag: PropTypes.object,
    afwijzingMorgen: PropTypes.object,
    daysClosed: PropTypes.array.isRequired,
};

module.exports = Component;

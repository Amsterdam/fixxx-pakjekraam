const OndernemerMarktAanwezigheid = require('./OndernemerMarktAanwezigheid');
const PropTypes = require('prop-types');
const React = require('react');
const OndernemerMarktVoorkeuren = require('./OndernemerMarktVoorkeuren');
const { getMarktDays, parseMarktDag, filterRsvpList } = require('../../domain-knowledge.js');
const OndernemerMarktHeading = require('./OndernemerMarktHeading');

const OndernemerAanwezigheid = ({ ondernemer, aanmeldingen, markten, plaatsvoorkeuren, startDate, endDate }) => {
    const sollicitaties = ondernemer.sollicitaties.filter(sollicitatie => !sollicitatie.doorgehaald);

    const entries = sollicitaties.map(sollicitatie => {
        const markt = markten.find(m => m.id === sollicitatie.markt.id);
        const marktAanmeldingen = (aanmeldingen || []).filter(
            aanmelding => aanmelding.marktId === sollicitatie.markt.id,
        );

        return {
            markt,
            rsvpEntries: filterRsvpList(marktAanmeldingen, markt),
            ondernemer,
            sollicitatie,
        };
    });

    return (
        <div className="OndernemerAanwezigheid">
            {entries.map(entry => (
                <div key={entry.markt.id} className="well">
                    <OndernemerMarktHeading markt={entry.markt} sollicitatie={entry.sollicitatie} />
                    <div className="row row--responsive">
                        <div className="col-1-2">
                            <OndernemerMarktAanwezigheid {...entry} />
                        </div>
                        <div className="col-1-2">
                            <OndernemerMarktVoorkeuren
                                plaatsvoorkeuren={plaatsvoorkeuren}
                                ondernemer={ondernemer}
                                markt={entry.markt}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

OndernemerAanwezigheid.propTypes = {
    ondernemer: PropTypes.object.isRequired,
    aanmeldingen: PropTypes.array,
    markten: PropTypes.array,
    plaatsvoorkeuren: PropTypes.array,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
};

module.exports = OndernemerAanwezigheid;

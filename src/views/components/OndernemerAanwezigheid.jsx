const OndernemerMarktAanwezigheid = require('./OndernemerMarktAanwezigheid');
const PropTypes = require('prop-types');
const React = require('react');

const { getMarktDays, parseMarktDag, filterRsvpList } = require('../../domain-knowledge.js');

const OndernemerAanwezigheid = ({ ondernemer, aanmeldingen, markten, startDate, endDate }) => {
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
                <OndernemerMarktAanwezigheid key={entry.markt.id} {...entry} />
            ))}
        </div>
    );
};

OndernemerAanwezigheid.propTypes = {
    ondernemer: PropTypes.array.isRequired,
    aanmeldingen: PropTypes.array,
    markten: PropTypes.array,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
};

module.exports = OndernemerAanwezigheid;

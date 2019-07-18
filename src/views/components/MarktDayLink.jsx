const { addDays, DAYS_IN_WEEK, formatDayOfWeek } = require('../../util.ts');
const { getMarktDays, parseMarktDag } = require('../../domain-knowledge.js');
const PropTypes = require('prop-types');
const React = require('react');

const MarktDayLink = ({ type, markt, offsetDate, direction = 1 }) => {
    let targetDate, startDate, endDate;

    if (direction === 1) {
        startDate = addDays(offsetDate, 1);
        endDate = addDays(offsetDate, 2 * DAYS_IN_WEEK);
    } else if (direction === -1) {
        startDate = addDays(offsetDate, -2 * DAYS_IN_WEEK);
        endDate = addDays(offsetDate, -1);
    } else {
        throw new TypeError();
    }

    const dates = getMarktDays(startDate, endDate, (markt.marktDagen || []).map(parseMarktDag));

    if (direction === 1) {
        targetDate = dates[0];
    } else if (direction === -1) {
        targetDate = dates[dates.length - 1];
    }

    return (
        <a
            className={`MarktDayLink MarktDayLink--${direction > 0 ? `right` : `left`}`}
            href={`/markt/${markt.id}/${targetDate}/${type}/`}
        >
            {formatDayOfWeek(targetDate)}
        </a>
    );
};

MarktDayLink.propTypes = {
    type: PropTypes.string.isRequired,
    markt: PropTypes.object.isRequired,
    offsetDate: PropTypes.string.isRequired,
    direction: PropTypes.number,
};

module.exports = MarktDayLink;

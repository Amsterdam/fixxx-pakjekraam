import { addDays, DAYS_IN_WEEK, formatDayOfWeek } from '../../util.js';
import { getUpcomingMarktDays, parseMarktDag } from '../../domain-knowledge.js';
import PropTypes from 'prop-types';
import React from 'react';

const MarktDayLink = ({ markt, offsetDate, direction = 1 }) => {
    let targetDate, startDate, endDate;

    if (direction === 1) {
        startDate = offsetDate;
        endDate = addDays(offsetDate, 2 * DAYS_IN_WEEK);
    } else if (direction === -1) {
        startDate = addDays(offsetDate, -2 * DAYS_IN_WEEK);
        endDate = addDays(offsetDate, -1);
    } else {
        throw new TypeError();
    }

    const dates = getUpcomingMarktDays(startDate, endDate, (markt.marktDagen || []).map(parseMarktDag));

    if (direction === 1) {
        targetDate = dates[0];
    } else if (direction === -1) {
        targetDate = dates[dates.length - 1];
    }

    const label = {
        '-1': 'Vorige',
        '1': 'Volgende',
    };

    return (
        <a
            className={`MarktDayLink MarktDayLink--${direction > 0 ? `right` : `left`}`}
            href={`/markt/${markt.id}/${targetDate}/indelingslijst/`}
        >
            {label[direction]} ({formatDayOfWeek(targetDate)})
        </a>
    );
};

MarktDayLink.propTypes = {
    markt: PropTypes.object.isRequired,
    offsetDate: PropTypes.string.isRequired,
    direction: PropTypes.number,
};

module.exports = MarktDayLink;

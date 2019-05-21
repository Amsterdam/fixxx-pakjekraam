const DAYS_IN_WEEK = 7;
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MILLISECONDS_IN_DAY = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;

const dayOfWeekName = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

const formatDayOfWeek = date => dayOfWeekName[new Date(date).getDay()];

const tomorrow = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);

    return date.toISOString().replace(/T.+/, '');
};

const endOfWeek = () => {
    const date = new Date();

    date.setDate(date.getDate() + (DAYS_IN_WEEK - 1 - date.getDay()));

    return date.toISOString().replace(/T.+/, '');
};

const nextWeek = () => {
    const date = new Date();

    date.setDate(date.getDate() + DAYS_IN_WEEK);

    return date.toISOString().replace(/T.+/, '');
};

module.exports = {
    formatDayOfWeek,
    tomorrow,
    endOfWeek,
    nextWeek,
    DAYS_IN_WEEK,
    MILLISECONDS_IN_SECOND,
    SECONDS_IN_MINUTE,
    MINUTES_IN_HOUR,
    HOURS_IN_DAY,
    MILLISECONDS_IN_DAY,
};

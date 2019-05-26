const DAYS_IN_WEEK = 7;
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MILLISECONDS_IN_DAY = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;

const dayOfWeekName = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const monthName = [
    'januari',
    'februari',
    'maart',
    'april',
    'mei',
    'juni',
    'juli',
    'augustus',
    'september',
    'oktober',
    'november',
    'december',
];

const formatDayOfWeek = date => dayOfWeekName[new Date(date).getDay()];
const formatMonth = date => monthName[new Date(date).getMonth()];

const addDays = (offsetDate, days) => {
    const date = new Date(offsetDate);

    date.setDate(date.getDate() + days);

    return date.toISOString().replace(/T.+/, '');
};

const tomorrow = () => addDays(Date.now(), 1);

const endOfWeek = () => {
    const date = new Date();

    return addDays(date.getDate(), DAYS_IN_WEEK - 1 - date.getDay());
};

const nextWeek = () => addDays(Date.now(), DAYS_IN_WEEK);

const toISODate = date => date.toISOString().replace(/T.+/, '');

const arrayToObject = (array, keyField) =>
    array.reduce((obj, item) => {
        obj[item[keyField]] = item;

        return obj;
    }, {});

module.exports = {
    addDays,
    formatDayOfWeek,
    formatMonth,
    tomorrow,
    endOfWeek,
    nextWeek,
    toISODate,
    arrayToObject,
    DAYS_IN_WEEK,
    MILLISECONDS_IN_SECOND,
    SECONDS_IN_MINUTE,
    MINUTES_IN_HOUR,
    HOURS_IN_DAY,
    MILLISECONDS_IN_DAY,
};

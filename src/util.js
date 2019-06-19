const DAYS_IN_WEEK = 7;
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MILLISECONDS_IN_DAY = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;
const shortMonthCharCount = 3;

const ISO_WEEK_DAYS = ['', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

const ISO_MONDAY = 1;
const ISO_TUESDAY = 2;
const ISO_WEDNESDAY = 3;
const ISO_THURSDAY = 4;
const ISO_FRIDAY = 5;
const ISO_SATURDAY = 6;
const ISO_SUNDAY = 7;

const WEEK_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

const SUNDAY = 0;
const MONDAY = 1;
const TUESDAY = 2;
const WEDNESDAY = 3;
const THURSDAY = 4;
const FRIDAY = 5;
const SATURDAY = 6;

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

const formatISODayOfWeek = day => ISO_WEEK_DAYS[day];
const formatDayOfWeek = date => WEEK_DAYS[new Date(date).getDay()];
const formatMonth = date => monthName[new Date(date).getMonth()];

const paginate = (arr, count) =>
    arr.reduce((t, a, i) => {
        if (i % count === 0) {
            t.push([]);
        }
        t[t.length - 1].push(a);

        return t;
    }, []);

const formatDate = date =>
    new Date(date).getDate() +
    ' ' +
    formatMonth(date).slice(0, shortMonthCharCount) +
    ' ' +
    new Date(date).getFullYear();

const today = () => new Date().toISOString().replace(/T.+/, '');

const dateDiffInDays = (date1, date2) => {
    const dt1 = new Date(date1),
        dt2 = new Date(date2);

    return Math.floor(
        (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
            Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
            MILLISECONDS_IN_DAY,
    );
};

const relativeHumanDay = date => {
    const dayOptions = { '0': 'vandaag', '1': 'morgen', '-1': 'gisteren' };
    const diff = String(dateDiffInDays(today(), date));

    return dayOptions[diff] ? dayOptions[diff] : '';
};

const capitalize = s => {
    if (typeof s !== 'string') return '';

    return s.charAt(0).toUpperCase() + s.slice(1);
};

const addDays = (offsetDate, days) => {
    const date = new Date(offsetDate);

    date.setDate(date.getDate() + days);

    return date.toISOString().replace(/T.+/, '');
};

const tomorrow = () => addDays(Date.now(), 1);

const endOfWeek = () => {
    const date = new Date();

    return addDays(date, DAYS_IN_WEEK - 1 - date.getDay());
};

const nextWeek = () => addDays(Date.now(), DAYS_IN_WEEK);

const toISODate = date => date.toISOString().replace(/T.+/, '');

const arrayToObject = (array, keyField) =>
    array.reduce((obj, item) => {
        obj[item[keyField]] = item;

        return obj;
    }, {});

const numberSort = (a, b) => (a > b ? 1 : a === b ? 0 : -1);

const stringSort = (a, b) => (a > b ? 1 : a === b ? 0 : -1);

const flatten = (a = [], b = []) => [...a, ...b];

module.exports = {
    paginate,
    today,
    addDays,
    formatISODayOfWeek,
    formatDayOfWeek,
    formatMonth,
    tomorrow,
    endOfWeek,
    nextWeek,
    toISODate,
    arrayToObject,
    numberSort,
    stringSort,
    flatten,
    formatDate,
    relativeHumanDay,
    capitalize,
    DAYS_IN_WEEK,
    WEEK_DAYS,
    MILLISECONDS_IN_SECOND,
    SECONDS_IN_MINUTE,
    MINUTES_IN_HOUR,
    HOURS_IN_DAY,
    MILLISECONDS_IN_DAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    SUNDAY,
    ISO_SUNDAY,
    ISO_MONDAY,
    ISO_TUESDAY,
    ISO_WEDNESDAY,
    ISO_THURSDAY,
    ISO_FRIDAY,
    ISO_SATURDAY,
};

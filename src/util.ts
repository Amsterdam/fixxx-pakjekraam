export const DAYS_IN_WEEK = 7;
export const MILLISECONDS_IN_SECOND = 1000;
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const MILLISECONDS_IN_DAY = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;
export const shortMonthCharCount = 3;

export const ISO_WEEK_DAYS = ['', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export const ISO_MONDAY = 1;
export const ISO_TUESDAY = 2;
export const ISO_WEDNESDAY = 3;
export const ISO_THURSDAY = 4;
export const ISO_FRIDAY = 5;
export const ISO_SATURDAY = 6;
export const ISO_SUNDAY = 7;

export const WEEK_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export const SUNDAY = 0;
export const MONDAY = 1;
export const TUESDAY = 2;
export const WEDNESDAY = 3;
export const THURSDAY = 4;
export const FRIDAY = 5;
export const SATURDAY = 6;

export const LF = '\n';

export const monthName = [
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

export const formatISODayOfWeek = (day: number) => ISO_WEEK_DAYS[day];
export const formatDayOfWeek = (date: string) => WEEK_DAYS[new Date(date).getDay()];
export const formatMonth = (date: string) => monthName[new Date(date).getMonth()];

export const paginate = <T>(arr: T[], count: number): T[][] =>
    arr.reduce((t, a, i) => {
        !(i % count) && t.push([]);
        t[t.length - 1].push(a);

        return t;
    }, []);

export const formatDate = (date: string): string =>
    `${new Date(date).getDate()} ${formatMonth(date).slice(0, shortMonthCharCount)} '${String(
        new Date(date).getFullYear(),
    ).substr(2, 2)}`;

export const formatDateFull = (date: string): string =>
    `${new Date(date).getDate()} ${formatMonth(date)} ${String(new Date(date).getFullYear())}`;

export const today = (): string => new Date().toISOString().replace(/T.+/, '');

export const dateDiffInDays = (date1: string, date2: string): number => {
    const dt1 = new Date(date1),
        dt2 = new Date(date2);

    return Math.floor(
        (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
            Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
            MILLISECONDS_IN_DAY,
    );
};

export const capitalize = (s: string) => {
    if (typeof s !== 'string') {
        return '';
    }

    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const relativeHumanDay = (date: string) => {
    const dayOptions: { [index: string]: string } = { '0': 'vandaag', '1': 'morgen', '-1': 'gisteren' };
    const diff = String(dateDiffInDays(today(), date));

    return dayOptions[diff] ? dayOptions[diff] : '';
};

export const fullRelativeHumanDate = (date: string): string =>
    `${relativeHumanDay(date) ? `${relativeHumanDay(date)}, ` : ''}${formatDayOfWeek(date)} ${formatDateFull(date)}`;

export const addDays = (offsetDate: string | number, days: number): string => {
    const date = new Date(offsetDate);

    date.setDate(date.getDate() + days);

    return date.toISOString().replace(/T.+/, '');
};

export const tomorrow = (): string => addDays(Date.now(), 1);

export const endOfWeek = (): string => {
    const date = new Date();

    return addDays(date.getTime(), DAYS_IN_WEEK - 1 - date.getDay());
};

export const nextWeek = (): string => addDays(Date.now(), DAYS_IN_WEEK);

export const toISODate = (date: Date): string => date.toISOString().replace(/T.+/, '');

export const arrayToObject = <T, K extends keyof T>(array: T[], keyField: K): { [index: string]: T } =>
    array.reduce((obj: { [index: string]: T }, item: T) => {
        obj[String(item[keyField])] = item;

        return obj;
    }, {});

export const numberSort = (a: number, b: number): number => (a > b ? 1 : a === b ? 0 : -1);

export const stringSort = (a: string, b: string): number => (a > b ? 1 : a === b ? 0 : -1);

export const flatten = <T>(a: T[] = [], b: T[] = []): T[] => [...a, ...b];

export const requireOne = <T>(arg: T[] | T | null): T => {
    if (Array.isArray(arg) && arg.length >= 1) {
        return arg[0];
    } else if (!Array.isArray(arg) && typeof arg !== 'undefined' && arg !== null) {
        return arg;
    } else {
        throw new TypeError('Must be exactly one');
    }
};

export const trace = (arg: any) => {
    console.log(arg);

    return arg;
};

export const traceError = (message: string) => (err: Error) => {
    console.error(message, err);

    throw err;
};

export const requireEnv = (key: string) => {
    if (!process.env[key]) {
        throw new Error(`Required environment variable "${key}" is not configured.`);
    }
};

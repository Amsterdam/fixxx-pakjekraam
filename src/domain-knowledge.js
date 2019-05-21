const { MILLISECONDS_IN_DAY, toISODate } = require('./util.js');

const DAPPERMARKT_ID = 16;
const ALBERT_CUYP_ID = 19;
const PLEIN_40_45_ID = 20;
const WESTERSTRAAT_ID = 37;
const REIGERSBOS_ID = 33;
const TUSSEN_MEER_ID = 38;

const slugs = {
    [DAPPERMARKT_ID]: 'dappermarkt',
    [ALBERT_CUYP_ID]: 'albert-cuyp',
    [PLEIN_40_45_ID]: 'plein-40-45',
    [WESTERSTRAAT_ID]: 'westerstraat',
    [REIGERSBOS_ID]: 'reigersbos',
    [TUSSEN_MEER_ID]: 'tussen-meer',
};

const slugifyMarkt = marktId => slugs[marktId] || String(marktId);

const dagen = {
    zo: 0,
    ma: 1,
    di: 2,
    wo: 3,
    do: 4,
    vr: 5,
    za: 6,
};

const parseMarktDag = dag => (dagen.hasOwnProperty(dag) ? dagen[dag] : -1);

const isVast = status => status === 'vpl' || status === 'vkk';

const getUpcomingMarktDays = (startDate, endDate, daysOfWeek) => {
    const start = Date.parse(startDate),
        end = Date.parse(endDate);

    const days = Math.max(0, (end - start) / MILLISECONDS_IN_DAY);

    const dates = [];

    for (let i = 1, l = days; i <= l; i++) {
        const date = new Date(start);

        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    return dates.filter(date => daysOfWeek.includes(date.getDay())).map(toISODate);
};

const formatOndernemerName = ondernemer =>
    `${ondernemer.voorletters} ${ondernemer.tussenvoegsels} ${ondernemer.achternaam}`.replace(/\s+/g, ' ');

module.exports = {
    DAPPERMARKT_ID,
    ALBERT_CUYP_ID,
    PLEIN_40_45_ID,
    WESTERSTRAAT_ID,
    REIGERSBOS_ID,
    TUSSEN_MEER_ID,
    formatOndernemerName,
    slugifyMarkt,
    parseMarktDag,
    isVast,
    getUpcomingMarktDays,
};

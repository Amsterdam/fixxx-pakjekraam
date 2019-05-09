const DAPPERMARKT_ID = 16;
const ALBERT_CUYP_ID = 19;
const PLEIN_40_45_ID = 20;
const WESTERSTRAAT_ID = 37;
const REIGERSBOS_ID = 20;
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

module.exports = {
    DAPPERMARKT_ID,
    ALBERT_CUYP_ID,
    PLEIN_40_45_ID,
    WESTERSTRAAT_ID,
    REIGERSBOS_ID,
    TUSSEN_MEER_ID,
    slugifyMarkt,
};

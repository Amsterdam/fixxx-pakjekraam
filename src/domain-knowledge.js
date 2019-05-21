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

module.exports = {
    DAPPERMARKT_ID,
    ALBERT_CUYP_ID,
    PLEIN_40_45_ID,
    WESTERSTRAAT_ID,
    REIGERSBOS_ID,
    TUSSEN_MEER_ID,
    slugifyMarkt,
    parseMarktDag,
    isVast,
};

const fs     = require('fs');
const path   = require('path');

const AdmZip = require('adm-zip');

const { MarktConfig } = require('./model/marktconfig.ts');

function flatten( a, b ) {
    a = Array.isArray(a) ? a : [a];
    b = Array.isArray(b) ? b : [b];
    return [...a, ...b];
}
function intersects( a, b ) {
    return !!a.find(value => b.includes(value));
}
function uniq( a, b ) {
    return a.includes(b) ? a : [...a, b];
}

function readJSON( filePath, emitError=true ) {
    try {
        const data = fs.readFileSync(filePath, { encoding: 'utf8' });
        return JSON.parse(String(data));
    } catch (e) {
        if (emitError) {
            throw e;
        } else {
            return undefined;
        }
    }
}

const CONFIG_DIR = path.resolve(__dirname, '../config/markt');
const CONFIG_PROPERTIES = [
    'locaties',
    'markt',
    'branches',
    'geografie',
    'paginas'
];
const SCHEMAS = require('./markt-config.model.js');

function run() {
    const marketSlugs = determineMarketsToValidate();
    let errors        = '';

    errors = marketSlugs.reduce((_errors, marketSlug) => {
        const marketPath = `${CONFIG_DIR}/${marketSlug}`;
        return checkMarket(_errors, marketPath);
    }, errors);

    if (!errors.length) {
        process.exit(0);
    } else {
        console.error(errors);
        process.exit(1);
    }
}

function checkMarket( errors, marketPath ) {
    try {
        const allBranches = readJSON(`${CONFIG_DIR}/branches.json`);
        const configJSON  = buildMarketConfigJSON(marketPath);
        MarktConfig.mergeAndValidateJSON(allBranches, configJSON);
    } catch (e) {
        if (e.constructor === Error) {
            errors += `${marketPath}\n${e}`;
        } else {
            throw e;
        }
    }

    return errors;
}
function buildMarketConfigJSON( marketPath ) {
    const configJSON = {};
    for (const prop of CONFIG_PROPERTIES) {
        configJSON[prop] = readJSON(`${marketPath}/${prop}.json`);
    }
    return configJSON;
}

function determineMarketsToValidate() {
    // Lijst van alle markten waar een config voor gedefinieerd is.
    const allMarketSlugs = fs.readdirSync(`${CONFIG_DIR}`, { withFileTypes: true })
    .reduce((result, dirEnt) => {
        return dirEnt.isDirectory() ?
               result.concat(dirEnt.name) :
               result;
    }, []);

    return allMarketSlugs;
}

run();

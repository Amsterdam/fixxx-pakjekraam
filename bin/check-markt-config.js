#!/usr/bin/env ts-node
const fs     = require('fs');
const path   = require('path');

const AdmZip = require('adm-zip');

const { MarktConfig } = require('../src/model/marktconfig.ts');

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

function readZipFileAsJSON( zipFile, filePath ) {
    const data = zipFile.readAsText(filePath, 'utf8');
    return data ?
           JSON.parse(data) :
           undefined;
}

const ZIP_PATH = path.resolve(process.argv[2]);
const CONFIG_PROPERTIES = [
    'locaties',
    'markt',
    'branches',
    'geografie',
    'paginas'
];
const SCHEMAS = require('../src/markt-config.model.js');

function run() {
    const zipFile     = new AdmZip(ZIP_PATH);
    const marketSlugs = determineMarketsToValidate(zipFile);
    let errors        = '';

    errors = marketSlugs.reduce((_errors, marketSlug) => {
        return _errors + checkMarket(zipFile, marketSlug);
    }, errors);

    if (!errors.length) {
        process.exit(0);
    } else {
        console.error(errors);
        process.exit(1);
    }
}

function checkMarket( zipFile, marketSlug ) {
    try {
        const allBranches = readZipFileAsJSON(zipFile, 'config/markt/branches.json');
        const configJSON  = buildMarketConfigJSON(zipFile, marketSlug);
        MarktConfig.mergeAndValidateJSON(allBranches, configJSON);
    } catch (e) {
        if (e.constructor === Error) {
            return `Markt: ${marketSlug}\n${e}`;
        } else {
            throw e;
        }
    }

    return '';
}
function buildMarketConfigJSON( zipFile, marketSlug ) {
    const configJSON = {};
    for (const prop of CONFIG_PROPERTIES) {
        configJSON[prop] = readZipFileAsJSON(zipFile, `config/markt/${marketSlug}/${prop}.json`);
    }
    return configJSON;
}

function determineMarketsToValidate(zipFile) {
    const zipEntries = zipFile.getEntries();
    const marktDirs  = zipEntries.filter(entry =>
        entry.isDirectory && entry.entryName.split('/').length == 4
    );

    return marktDirs.map(entry => entry.entryName.split('/')[2]);
}

run();

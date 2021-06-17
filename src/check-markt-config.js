const fs   = require('fs');
const path = require('path');

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

const PROJECT_DIR = path.dirname(__dirname);
const ROOTFILES   = [
    'config/markt/branches.json',
    'config/markt/obstakeltypes.json',
    'config/markt/plaatseigenschappen.json'
];
const MARKETFILES = [
    'locaties.json',
    'markt.json',
    'branches.json',
    'geografie.json',
    'paginas.json'
];
const INDEX       = {
    branches: indexAllBranches(`${PROJECT_DIR}/config/markt/branches.json`),
    obstakelTypes: readJSON(`${PROJECT_DIR}/config/markt/obstakeltypes.json`),
    plaatsEigenschappen: readJSON(`${PROJECT_DIR}/config/markt/plaatseigenschappen.json`)
};
const SCHEMAS     = require('./markt-config.model.js')(INDEX);

function run() {
    const marketSlugs = determineMarketsToValidate();
    let errors        = {};

    errors = checkRootFiles(errors, PROJECT_DIR);

    errors = marketSlugs.reduce((_errors, marketSlug) => {
        const marketPath = `${PROJECT_DIR}/config/markt/${marketSlug}`;
        return checkMarket(_errors, marketPath);
    }, errors);

    if (!Object.keys(errors).length) {
        process.exit(0);
    }

    Object.keys(errors).forEach(filePath => {
        const fileErrors = errors[filePath];
        console.log(`${filePath}`);
        fileErrors.forEach(error => console.log(`  ${error}`));
    });
    process.exit(1);
}

function validateFile(
    errors,
    filePath,
    schema,
    extraValidation = null, // function
    required = true
) {
    let fileErrors;
    try {
        const data = readJSON(filePath);

        fileErrors = schema(data).errors.map(error => {
            switch (error.name) {
                case 'enum':
                    return `${error.property} has unknown value '${error.instance}'`;
                default:
                    return error.stack;
            }
        });
        if (typeof extraValidation === 'function') {
            fileErrors = extraValidation(fileErrors, data);
        }
    } catch (e) {
        switch (e.code) {
            case 'EACCESS':
                fileErrors = ['Read permission denied'];
                break;
            case 'EISDIR':
                fileErrors = ['Expected a file, found a directory'];
                break;
            case 'ENOENT':
                fileErrors = required ? ['File not found'] : [];
                break;
            default:
                fileErrors = [`Unexpected error: ${e.stack || e.message}`];
        }
    }

    if (!fileErrors.length) {
        return errors;
    }

    return {
        ...errors,
        [filePath]: fileErrors
    };
}

function checkRootFiles( errors ) {
    errors = validateFile(
        errors,
        `${PROJECT_DIR}/config/markt/branches.json`,
        SCHEMAS.AllBranches
    );

    return errors;
}

function checkMarket( errors, marketPath ) {
    const index = {
        locaties: indexMarktPlaatsen(`${marketPath}/locaties.json`),
        markt: indexMarktRows(`${marketPath}/markt.json`)
    };

    for (const fileName of MARKETFILES) {
        errors = VALIDATORS[fileName](errors, `${marketPath}/${fileName}`, index);
    }
    return errors;
}
const VALIDATORS = {
    'branches.json': function( errors, filePath, index ) {
        const validate = ( fileErrors, marketBranches ) => {
            marketBranches.reduce((unique, { brancheId }, i) => {
                if (unique.includes(brancheId)) {
                    fileErrors.push([`DATA[${i}] Duplicate branche '${brancheId}'`]);
                } else {
                    unique.push(brancheId);
                }

                return unique;
            }, []);
            return fileErrors;
        };

        return validateFile(errors, filePath, SCHEMAS.MarketBranches, validate, false);
    },
    'geografie.json': function( errors, filePath, index ) {
        const validate = ( fileErrors, { obstakels } ) => {
            obstakels.reduce((unique, obstakel, i) => {
                const current = [obstakel.kraamA, obstakel.kraamB].sort();
                // Is obstakeldefinitie uniek?
                if (!unique.find(entry => entry.join() === current.join())) {
                    // Bestaan beide kramen in `locaties.json`?
                    if (obstakel.kraamA && !index.locaties.includes(obstakel.kraamA)) {
                        fileErrors.push(`DATA.obstakels[${i}].kraamA does not exist: ${obstakel.kraamA}`);
                    }
                    if (obstakel.kraamB && !index.locaties.includes(obstakel.kraamB)) {
                        fileErrors.push(`DATA.obstakels[${i}].kraamB does not exist: ${obstakel.kraamB}`);
                    }

                    // Staan beide kramen in verschillende rijen in `markt.json`?
                    if (
                        current[0] in index.markt && current[1] in index.markt &&
                        index.markt[current[0]] === index.markt[current[1]]
                    ) {
                        fileErrors.push(`DATA.obstakels[${i}] kraamA and kraamB cannot be in the same row (kraamA: ${obstakel.kraamA}, kraamB: ${obstakel.kraamB})`);
                    }

                    unique.push(current);
                } else {
                    fileErrors.push(`DATA.obstakels[${i}] is not unique (kraamA: ${obstakel.kraamA}, kraamB: ${obstakel.kraamB})`);
                }

                return unique;
            }, []);

            return fileErrors;
        };

        return validateFile(errors, filePath, SCHEMAS.MarketGeografie, validate, false);
    },
    'locaties.json': function( errors, filePath, index ) {
        const validate = ( fileErrors, locaties ) => {
            locaties.reduce((unique, { plaatsId }, i) => {
                if (unique.includes(plaatsId)) {
                    fileErrors.push(`DATA[${i}].plaatsId is not unique: ${plaatsId}`);
                } else {
                    if (!(plaatsId in index.markt)) {
                        fileErrors.push(`DATA[${i}].plaatsId does not exist in markt.json: ${plaatsId}`);
                    }

                    unique.push(plaatsId);
                }

                return unique;
            }, []);

            return fileErrors;
        };

        return validateFile(errors, filePath, SCHEMAS.MarketLocaties, validate, true);
    },
    'markt.json': function( errors, filePath, index ) {
        const validate = ( fileErrors, { rows } ) => {
            return rows.reduce((_fileErrors, row, i) => {
                row.forEach((plaatsId, j) => {
                    if (!index.locaties.includes(plaatsId)) {
                        _fileErrors.push(`DATA.rows[${i}][${j}].plaatsId does not exist in locaties.json: ${plaatsId}`);
                    }
                });

                return _fileErrors;
            }, fileErrors);
        };

        return validateFile(errors, filePath, SCHEMAS.Market, validate, true);
    },
    'paginas.json': function( errors, filePath, index ) {
        const validate = ( fileErrors, sections ) => {
            sections.forEach((section, i) => {
                section.indelingslijstGroup.forEach((group, j) => {
                    if ('plaatsList' in group) {
                        fileErrors = group.plaatsList.reduce((_fileErrors, plaatsId, k) => {
                            return !index.locaties.includes(plaatsId) ?
                                   _fileErrors.concat(`DATA[${i}].indelingslijstGroup[${j}].plaatsList[${k}] does not exist in locaties.json: ${plaatsId}`) :
                                   _fileErrors;
                        }, fileErrors);
                    }
                });
            });

            return fileErrors;
        };

        return validateFile(errors, filePath, SCHEMAS.Paginas, validate, true);
    }
};

function determineMarketsToValidate() {
    // Verkrijg alle gewijzigde bestanden in de `config/markt/` folder, relatief aan de
    // project folder.
    const changedFiles = process.argv.slice(2)
                         .map(fullPath => path.relative(PROJECT_DIR, fullPath))
                         .filter(relPath => relPath.startsWith('config/markt/'));
    // Lijst van alle markten waar een config voor gedefinieerd is.
    const allMarketSlugs = fs.readdirSync(`${PROJECT_DIR}/config/markt`, { withFileTypes: true })
    .reduce((result, dirEnt) => {
        return dirEnt.isDirectory() ?
               result.concat(dirEnt.name) :
               result;
    }, []);
    // Lijst van alle markten waarvan een config bestand gewijzigd is.
    const changedMarketSlugs = changedFiles.reduce((result, relPath) => {
        const marketSlug = path.basename(path.dirname(relPath));
        return marketSlug !== 'markt' && !result.includes(marketSlug) ?
               result.concat(marketSlug) :
               result;
    }, []);

    // Als één van de 'root' bestanden is gewijzigd moeten alle markten gecontroleerd worden.
    // Anders enkel degenen die gewijzigde config bestanden bevatten.
    const checkAllMarkets = !changedFiles.length ||
                            intersects(changedFiles, ROOTFILES);

    return checkAllMarkets ?
           allMarketSlugs :
           changedMarketSlugs;
}

function indexAllBranches( filePath ) {
    const branches = readJSON(filePath);
    return branches.map(branche => branche.brancheId);
}
function indexMarktPlaatsen( filePath ) {
    const plaatsen = readJSON(filePath, false) || [];
    return plaatsen.map(plaats => plaats.plaatsId);
}
function indexMarktRows( filePath ) {
    const markt = readJSON(filePath, false);
    if (!markt) {
        return {};
    }

    const index = {};
    markt.rows.forEach((row, rowNum) => {
        for (const plaatsId of row) {
            index[plaatsId] = rowNum;
        }
    });
    return index;
}

run();

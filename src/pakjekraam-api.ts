import {
    getALijst,
    getMarkt,
    getMarkten as getMakkelijkeMarkten,
    getMarktondernemersByMarkt,
} from './makkelijkemarkt-api';
import { formatOndernemerName, slugifyMarkt } from './domain-knowledge.js';
import { numberSort, stringSort } from './util.js';
import Sequelize from 'sequelize';
import { allocation, plaatsvoorkeur, rsvp, voorkeur } from './model/index';
import { calcToewijzingen } from './indeling';

import {
    IBranche,
    IMarktProperties,
    IMarktondernemer,
    IMarktondernemerVoorkeur,
    IMarktondernemerVoorkeurRow,
    IMarktplaats,
    IObstakelBetween,
    IPlaatsvoorkeur,
    IRSVP,
} from './markt.model';
import { IAllocationPrintout, IAllocationPrintoutPage, IMarketRow } from './model/printout.model';
import { RSVP } from './model/rsvp.model';
import { Allocation } from './model/allocation.model';
import { Plaatsvoorkeur } from './model/plaatsvoorkeur.model';
import { Voorkeur } from './model/voorkeur.model';

import { MMSollicitatieStandalone } from './makkelijkemarkt.model';

import * as fs from 'fs';

const loadJSON = <T>(path: string, defaultValue: T = null): Promise<T> =>
    new Promise((resolve, reject) => {
        console.log(`Load ${path}`);
        fs.readFile(path, (err, data) => {
            if (err) {
                resolve(defaultValue);
            } else {
                try {
                    resolve(JSON.parse(String(data)));
                } catch (e) {
                    reject(e);
                }
            }
        });
    });

export const getAanmeldingen = (marktId: string, marktDate: string): Promise<IRSVP[]> =>
    rsvp
        .findAll<RSVP>({
            where: { marktId, marktDate },
        })
        .then(aanmeldingen => aanmeldingen);

export const getAanmeldingenMarktOndern = (marktId: string, erkenningsNummer: string): Promise<IRSVP[]> =>
    rsvp
        .findAll<RSVP>({
            where: { marktId, erkenningsNummer },
        })
        .then(aanmeldingen => aanmeldingen);

export const getAanmeldingenByOndernemer = (erkenningsNummer: string): Promise<IRSVP[]> =>
    rsvp
        .findAll<RSVP>({
            where: { erkenningsNummer },
        })
        .then(aanmeldingen => aanmeldingen);

export const getToewijzingen = (marktId: string, marktDate: string): Promise<Allocation[]> =>
    allocation
        .findAll<Allocation>({
            where: { marktId, marktDate },
        })
        .then(toewijzingen => toewijzingen);

export const getPlaatsvoorkeuren = (marktId: string): Promise<IPlaatsvoorkeur[]> =>
    plaatsvoorkeur
        .findAll<Plaatsvoorkeur>({
            where: { marktId },
        })
        .then(plaatsvoorkeuren => plaatsvoorkeuren);

export const getVoorkeurenMarktOndern = (marktId: string, erkenningsNummer: string): Promise<IPlaatsvoorkeur[]> =>
    plaatsvoorkeur
        .findAll<Plaatsvoorkeur>({
            where: { marktId, erkenningsNummer },
        })
        .then(plaatsvoorkeuren => plaatsvoorkeuren);

const indelingVoorkeurPrio = (voorkeur: IMarktondernemerVoorkeur): number =>
    (voorkeur.marktId ? 1 : 0) | (voorkeur.marktDate ? 2 : 0);
const indelingVoorkeurSort = (a: IMarktondernemerVoorkeur, b: IMarktondernemerVoorkeur) =>
    numberSort(indelingVoorkeurPrio(a), indelingVoorkeurPrio(b));

const indelingVoorkeurMerge = (a: IMarktondernemerVoorkeur, b: IMarktondernemerVoorkeur): IMarktondernemerVoorkeur => {
    const merged = Object.assign({}, a);

    if (b.aantalPlaatsen !== null) {
        merged.aantalPlaatsen = b.aantalPlaatsen;
    }
    if (b.krachtStroom !== null) {
        merged.krachtStroom = b.krachtStroom;
    }
    if (b.kraaminrichting !== null) {
        merged.kraaminrichting = b.kraaminrichting;
    }
    if (b.anywhere !== null) {
        merged.anywhere = b.anywhere;
    }
    if (b.inactive !== null) {
        merged.inactive = b.inactive;
    }
    if (b.branches !== null) {
        merged.branches = b.branches;
    }
    if (b.verkoopinrichting !== null) {
        merged.verkoopinrichting = b.verkoopinrichting;
    }

    return merged;
};

export const getIndelingVoorkeur = (
    erkenningsNummer: string,
    marktId: string = null,
    marktDate: string = null,
): Promise<IMarktondernemerVoorkeur> => {
    const where = {
        erkenningsNummer,
        [Sequelize.Op.and]: [
            { [Sequelize.Op.or]: [{ marktId }, { marktId: null }] },
            { [Sequelize.Op.or]: [{ marktDate }, { marktDate: null }] },
        ],
    };

    return voorkeur
        .findAll<Voorkeur>({
            where,
        })
        .then(voorkeuren => voorkeuren.sort(indelingVoorkeurSort).reduce(indelingVoorkeurMerge, null));
};

const groupByErkenningsNummer = (
    groups: IMarktondernemerVoorkeur[][],
    voorkeur: IMarktondernemerVoorkeur,
): IMarktondernemerVoorkeur[][] => {
    let group;

    for (let i = groups.length; i--; ) {
        if (groups[i][0].erkenningsNummer === voorkeur.erkenningsNummer) {
            group = groups[i];
            break;
        }
    }

    if (group) {
        group.push(voorkeur);
    } else {
        groups.push([voorkeur]);
    }

    return groups;
};

const convertVoorkeur = (obj: IMarktondernemerVoorkeurRow): IMarktondernemerVoorkeur => ({
    ...obj,
    branches: [obj.brancheId, obj.parentBrancheId].filter(Boolean),
    verkoopinrichting: obj.inrichting ? [obj.inrichting] : [],
});

export const getIndelingVoorkeuren = (
    marktId: string,
    marktDate: string = null,
): Promise<IMarktondernemerVoorkeur[]> => {
    const where = {
        [Sequelize.Op.and]: [
            {
                [Sequelize.Op.or]: marktId ? [{ marktId }, { marktId: null }] : [{ marktId: null }],
            },
            {
                [Sequelize.Op.or]: marktDate ? [{ marktDate }, { marktDate: null }] : [{ marktDate: null }],
            },
        ],
    };

    return voorkeur
        .findAll<Voorkeur>({
            where,
        })
        .then(voorkeuren =>
            voorkeuren
                .sort((a, b) => indelingVoorkeurSort(a, b) || stringSort(a.erkenningsNummer, b.erkenningsNummer))
                .reduce(groupByErkenningsNummer, [])
                .map(arr => arr.reduce(indelingVoorkeurMerge)),
        );
};

export const getOndernemerVoorkeuren = (erkenningsNummer: string): Promise<IPlaatsvoorkeur[]> =>
    plaatsvoorkeur.findAll<Plaatsvoorkeur>({
        where: { erkenningsNummer },
    });

export const getMarktProperties = (marktId: string): Promise<IMarktProperties> =>
    loadJSON(`./data/${slugifyMarkt(marktId)}/markt.json`, {});

export const getBranches = (marktId: string): Promise<IBranche[]> =>
    loadJSON(`./data/${slugifyMarkt(marktId)}/branches.json`, []);

export const getAllBranches = (): Promise<IBranche[]> => loadJSON('./data/branches.json', []);

export const getMarktplaatsen = (marktId: string): Promise<IMarktplaats[]> =>
    loadJSON(`./data/${slugifyMarkt(marktId)}/locaties.json`, []);

export const getMarktPaginas = (marktId: string): Promise<IAllocationPrintout> =>
    loadJSON(`./data/${slugifyMarkt(marktId)}/paginas.json`, []);

export const getMarktGeografie = (marktId: string): Promise<{ obstakels: IObstakelBetween[] }> =>
    loadJSON(`./data/${slugifyMarkt(marktId)}/geografie.json`, { obstakels: [] });

/*
 * Convert an object from Makkelijke Markt to our own type of `IMarktondernemer` object
 */
const convertOndernemer = (data: MMSollicitatieStandalone): IMarktondernemer => {
    const {
        koopman: { erkenningsnummer },
        sollicitatieNummer,
        status,
        markt,
    } = data;

    return {
        description: formatOndernemerName(data.koopman),
        erkenningsNummer: erkenningsnummer,
        plaatsen: data.vastePlaatsen,
        voorkeur: {
            marktId: String(markt.id),
            erkenningsNummer: erkenningsnummer,
            aantalPlaatsen: Math.max(1, data.aantal3MeterKramen + data.aantal4MeterKramen),
        },
        sollicitatieNummer,
        status,
    };
};

export const getIndelingslijstInput = (token: string, marktId: string, marktDate: string) => {
    const ondernemersPromise = getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
        ondernemers.filter(ondernemer => !ondernemer.doorgehaald).map(convertOndernemer),
    );
    const voorkeurenPromise = getIndelingVoorkeuren(marktId, marktDate).then(voorkeuren =>
        voorkeuren.map(convertVoorkeur),
    );

    // Populate the `ondernemer.voorkeur` field
    const enrichedOndernemers = Promise.all([ondernemersPromise, voorkeurenPromise]).then(([ondernemers, voorkeuren]) =>
        ondernemers.map(ondernemer => ({
            ...ondernemer,
            voorkeur: {
                ...ondernemer.voorkeur,
                ...voorkeuren.find(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer),
            },
        })),
    );

    return Promise.all([
        getMarktProperties(marktId),
        enrichedOndernemers,
        getMarktplaatsen(marktId),
        getAanmeldingen(marktId, marktDate),
        getPlaatsvoorkeuren(marktId),
        getBranches(marktId),
        getMarktPaginas(marktId),
        getMarktGeografie(marktId),
        getMarkt(token, marktId),
        getALijst(token, marktId, marktDate),
    ]).then(args => {
        const [
            marktProperties,
            ondernemers,
            marktplaatsen,
            aanmeldingen,
            voorkeuren,
            branches,
            paginas,
            geografie,
            markt,
            aLijst,
        ] = args;

        return {
            naam: '?',
            marktId,
            marktDate,
            ...marktProperties,
            aanmeldingen,
            voorkeuren,
            branches,
            ondernemers,
            paginas,
            obstakels: geografie.obstakels || [],
            markt,
            marktplaatsen,
            aanwezigheid: aanmeldingen,
            aLijst: aLijst.map(({ koopman: { erkenningsnummer } }) =>
                ondernemers.find(({ erkenningsNummer }) => erkenningsnummer === erkenningsNummer),
            ),
            rows: (
                marktProperties.rows ||
                paginas.reduce(
                    (list: string[][], pagina: IAllocationPrintoutPage): string[][] => [
                        ...list,
                        ...pagina.indelingslijstGroup
                            .map(group => (group as IMarketRow).plaatsList)
                            .filter(Array.isArray),
                    ],
                    [],
                )
            ).map(row => row.map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId))),
        };
    });
};

export const getIndelingslijst = (token: string, marktId: string, date: string) =>
    getIndelingslijstInput(token, marktId, date).then(data => {
        const logMessage = `Marktindeling berekenen: ${data.markt.naam}`;

        console.time(logMessage);
        const indeling = calcToewijzingen(data);
        console.timeEnd(logMessage);

        return indeling;
    });

export const getMailContext = (token: string, marktId: string, erkenningsNr: string, marktDate: string) =>
    Promise.all([
        getIndelingslijst(token, marktId, marktDate),
        getVoorkeurenMarktOndern(marktId, erkenningsNr),
        getAanmeldingenMarktOndern(marktId, erkenningsNr),
        getAllBranches(),
    ]).then(([markt, voorkeuren, aanmeldingen, branches]) => {
        const ondernemer = markt.ondernemers.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const inschrijving = markt.aanwezigheid.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const toewijzing = markt.toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const afwijzing = markt.afwijzingen.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const voorkeurenObjPrio: { [index: string]: IPlaatsvoorkeur[] } = (voorkeuren || []).reduce(
            (hash: { [index: string]: IPlaatsvoorkeur[] }, voorkeur) => {
                if (!hash.hasOwnProperty(voorkeur.priority)) {
                    hash[voorkeur.priority] = [];
                }
                hash[voorkeur.priority].push(voorkeur);

                return hash;
            },
            {},
        );
        const voorkeurenPrio = Object.keys(voorkeurenObjPrio)
            .map(key => voorkeurenObjPrio[key])
            .sort((a, b) => b[0].priority - a[0].priority)
            .map(voorkeurList => voorkeurList.map(voorkeur => voorkeur.plaatsId));

        return {
            markt,
            marktDate,
            ondernemer,
            inschrijving,
            toewijzing,
            afwijzing,
            voorkeuren: voorkeurenPrio,
            aanmeldingen,
            branches,
        };
    });

export const getSollicitantenlijstInput = (token: string, marktId: string, date: string) =>
    Promise.all([
        getMarktondernemersByMarkt(token, marktId).then(ondernemers =>
            ondernemers.filter(
                ondernemer => !ondernemer.doorgehaald && (ondernemer.status === 'soll' || ondernemer.status === 'vkk'),
            ),
        ),
        getAanmeldingen(marktId, date),
        getPlaatsvoorkeuren(marktId),
        getMarkt(token, marktId),
    ]).then(args => {
        const [ondernemers, aanmeldingen, voorkeuren, markt] = args;

        return {
            ondernemers,
            aanmeldingen,
            voorkeuren,
            markt,
        };
    });

export const getMarkten = (token: string) =>
    getMakkelijkeMarkten(token)
        // Only show markten for which JSON data with location info exists
        .then(markten => markten.filter(markt => fs.existsSync(`data/${slugifyMarkt(markt.id)}/locaties.json`)));

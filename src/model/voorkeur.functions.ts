import { voorkeur } from './index';
import { IMarktondernemerVoorkeur, IMarktondernemerVoorkeurRow } from '../markt.model';
import { MMSollicitatie } from '../makkelijkemarkt.model';
import { isVast } from '../domain-knowledge';
import { ddmmyyyyToDate } from '../util';
import { Voorkeur } from './voorkeur.model';

import Sequelize from 'sequelize';

export const getDefaultVoorkeur = (sollicitatie: MMSollicitatie) => {
    return {
        minimum: isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1,
        maximum: isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1,
        anywhere: isVast(sollicitatie.status) ? false : true,
    };
};

export const voorkeurenFormData = (body: any): IMarktondernemerVoorkeurRow => {

    const { absentFrom, absentUntil, erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting } = body;
    const anywhere = JSON.parse(body.anywhere);
    const minimum = typeof body.minimum === 'string' ? parseInt(body.minimum, 10) || null : null;
    const maximum = typeof body.maximum === 'string' ? parseInt(body.maximum, 10) || null : null;

    let absentFromDate = null;
    let absentUntilDate = null;

    if (absentFrom) {
        absentFromDate = ddmmyyyyToDate(absentFrom);
    }

    if (absentUntil) {
        absentUntilDate = ddmmyyyyToDate(absentUntil);
    }

    const voorkeur = {
        erkenningsNummer,
        marktId: marktId || null,
        marktDate: marktDate || null,
        anywhere,
        minimum,
        maximum,
        brancheId: brancheId || null,
        parentBrancheId: parentBrancheId || null,
        inrichting: inrichting || null,
        absentFrom: absentFromDate || null,
        absentUntil: absentUntilDate || null,
    };
    return voorkeur;
};

export const deleteVoorkeurenByErkenningsnummer = (erkenningsNummer: string) =>
    voorkeur
        .destroy({ where: { erkenningsNummer } });

export const getVoorkeurenByMarkt = (marktId: string): Promise<IMarktondernemerVoorkeur[]> =>
    voorkeur
        .findAll<Voorkeur>({
            where: { marktId }, raw: true
        })
        .then(voorkeuren => voorkeuren);

export const getVoorkeurByOndernemer = (erkenningsNummer: string): Promise<IMarktondernemerVoorkeur> =>
    voorkeur
        .findOne<Voorkeur>({
            where: { erkenningsNummer }, raw: true
        });

export const getVoorkeurByMarktEnOndernemer = (marktId: string, erkenningsNummer: string): Promise<IMarktondernemerVoorkeurRow> =>
voorkeur
    .findOne<Voorkeur>({
        where: { erkenningsNummer, marktId }, raw: true
    });

export const getVoorkeurenAbsentByMarkt = (marktId: string): Promise<IMarktondernemerVoorkeur[]> =>
    voorkeur
        .findAll<Voorkeur>({
            where: {
                marktId,
                absentFrom: {
                    [Sequelize.Op.ne]: null
                },
                absentUntil: {
                    [Sequelize.Op.ne]: null
                },
            }, raw: true
        });

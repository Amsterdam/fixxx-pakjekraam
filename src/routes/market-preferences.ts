import { Request, Response } from 'express';
import { IMarktondernemerVoorkeurRow } from '../markt.model';
import { upsert } from '../sequelize-util.js';
import models from '../model/index';
import { internalServerErrorPage, HTTP_CREATED_SUCCESS } from '../express-util';

export const algemeneVoorkeurenFormData = (body: any): IMarktondernemerVoorkeurRow => {
    const { erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting } = body;

    const inactive = !!body.inactive;
    const anywhere = !!body.anywhere;
    const aantalPlaatsen = parseInt(body.aantalPlaatsen, 10) || null;

    const voorkeur = {
        erkenningsNummer,
        marktId: marktId || null,
        marktDate: marktDate || null,
        anywhere,
        aantalPlaatsen,
        brancheId: brancheId || null,
        parentBrancheId: parentBrancheId || null,
        inrichting: inrichting || null,
        inactive,

        monday: !!body.monday,
        tuesday: !!body.tuesday,
        wednesday: !!body.wednesday,
        thursday: !!body.thursday,
        friday: !!body.friday,
        saturday: !!body.saturday,
        sunday: !!body.sunday,
    };

    return voorkeur;
};

export const updateMarketPreferences = (req: Request, res: Response) => {
    const { next } = req.body;

    const data = algemeneVoorkeurenFormData(req.body);

    const { erkenningsNummer, marktId, marktDate } = data;

    upsert(
        models.voorkeur,
        {
            erkenningsNummer,
            marktId,
            marktDate,
        },
        data,
    ).then(() => res.status(HTTP_CREATED_SUCCESS).redirect(next ? next : '/'), internalServerErrorPage(res));
};

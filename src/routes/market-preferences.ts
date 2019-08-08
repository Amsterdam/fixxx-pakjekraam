import { NextFunction, Request, Response } from 'express';
import { IMarktondernemerVoorkeurRow } from '../markt.model';
import { upsert } from '../sequelize-util.js';
import models from '../model/index';
import { internalServerErrorPage, HTTP_CREATED_SUCCESS, getQueryErrors } from '../express-util';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getAllBranches, getIndelingVoorkeur } from '../pakjekraam-api';

export const algemeneVoorkeurenFormData = (body: any): IMarktondernemerVoorkeurRow => {
    const { erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting } = body;

    const inactive = !!body.inactive;
    const anywhere = !!body.anywhere;
    const minimum = typeof body.minimum === 'string' ? parseInt(body.minimum, 10) || null : null;
    const maximum = typeof body.maximum === 'string' ? parseInt(body.maximum, 10) || null : null;

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

export const updateMarketPreferences = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) => {
    const data = algemeneVoorkeurenFormData(req.body);

    const { marktId, marktDate } = data;

    upsert(
        models.voorkeur,
        {
            erkenningsNummer,
            marktId,
            marktDate,
        },
        data,
    ).then(
        () => res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next ? req.body.next : '/'),
        internalServerErrorPage(res),
    );
};

export const marketPreferencesPage = (
    req: Request,
    res: Response,
    erkenningsNummer: string,
    marktId: string,
    marktDate: string,
    role: string,
) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(erkenningsNummer);
    const marktPromise = marktId ? getMarkt(marktId) : Promise.resolve(null);

    // TODO: Only allow relative URLs in `next`, to prevent redirection to 3rd party phishing sites
    const next = req.query.next;
    const query = req.query;

    Promise.all([
        ondernemerPromise,
        marktPromise,
        getIndelingVoorkeur(erkenningsNummer, marktId, marktDate),
        getAllBranches(),
    ]).then(([ondernemer, markt, voorkeur, branches]) => {
        res.render('AlgemeneVoorkeurenPage', {
            ondernemer,
            markt,
            marktId,
            voorkeur,
            branches,
            next,
            query,
            messages,
            role,
        });
    }, internalServerErrorPage(res));
};

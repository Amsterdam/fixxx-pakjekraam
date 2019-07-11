import { NextFunction, Request, Response } from 'express';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getAanmeldingenByOndernemer } from '../pakjekraam-api';
import { httpErrorPage, HTTP_CREATED_SUCCESS, HTTP_INTERNAL_SERVER_ERROR } from '../express-util';
import models from '../model/index';
import { tomorrow } from '../util.js';

export const marketApplicationPage = (
    res: Response,
    token: string,
    erkenningsNummer: string,
    marktId: string,
    query: any,
) => {
    Promise.all([
        getMarktondernemer(token, erkenningsNummer),
        getAanmeldingenByOndernemer(erkenningsNummer),
        getMarkt(token, marktId),
    ]).then(
        ([ondernemer, aanmeldingen, markt]) => {
            res.render('AanmeldPage', { ondernemer, aanmeldingen, markt, date: tomorrow() });
        },
        err => httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR)(err),
    );
};

const aanmeldFormDataToRSVP = (formData: any, erkenningsNummer: string) => ({
    marktId: parseInt(formData.marktId, 10),
    marktDate: formData.aanmelding,
    erkenningsNummer,
    attending: true,
});

export const handleMarketApplication = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) =>
    models.rsvp
        .create(aanmeldFormDataToRSVP(req.body, erkenningsNummer))
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next || '/'),
            (error: Error) => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
        );

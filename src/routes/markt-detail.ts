import { NextFunction, Request, Response } from 'express';

import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';

import {
    getAllBranches,
    getIndelingVoorkeur,
    getAanmeldingenByOndernemer,
    getOndernemerVoorkeuren,
} from '../pakjekraam-api';

import { HTTP_INTERNAL_SERVER_ERROR, httpErrorPage, getQueryErrors } from '../express-util';

export const marktDetailController = (
    req: Request,
    res: Response,
    next: NextFunction,
    erkenningsNummer: string,
): void => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(req.session.token, erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(erkenningsNummer);
    const marktPromise = req.params.marktId ? getMarkt(req.session.token, req.params.marktId) : Promise.resolve(null);
    const query = req.query;

    Promise.all([
        ondernemerPromise,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(erkenningsNummer),
        marktPromise,
        getIndelingVoorkeur(erkenningsNummer, req.params.marktId),
        getAllBranches(),
    ]).then(
        ([ondernemer, plaatsvoorkeuren, aanmeldingen, markt, voorkeur, branches]) => {
            res.render('OndernemerMarktDetailPage', {
                ondernemer,
                plaatsvoorkeuren,
                aanmeldingen,
                markt,
                voorkeur,
                branches,
                marktId: req.params.marktId,
                next: req.query.next,
                query,
                messages,
            });
        },
        err => httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR)(err),
    );
};

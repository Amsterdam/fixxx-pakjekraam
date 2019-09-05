import { NextFunction, Request, Response } from 'express';

import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getToewijzingenByOndernemer } from '../pakjekraam-api';

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

    const marktId = req.params.marktId;
    const query = req.query;

    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(erkenningsNummer);
    const toewijzingenPromise = getToewijzingenByOndernemer(marktId, erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(erkenningsNummer);

    const marktPromise = marktId ? getMarkt(marktId) : Promise.resolve(null);


    Promise.all([
        ondernemerPromise,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(erkenningsNummer),
        marktPromise,
        getIndelingVoorkeur(erkenningsNummer, req.params.marktId),
        getAllBranches(),
        toewijzingenPromise
    ])
        .then(
            ([ondernemer, plaatsvoorkeuren, aanmeldingen, markt, voorkeur, branches, toewijzingen]) => {
                // console.log(Object.keys(req));
                // console.log(req.session);
                // console.log('welke');
                // console.log(toewijzingen);
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
                    toewijzingen,
                });
            },
            err => httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR)(err),
        )
        .catch(next);
};

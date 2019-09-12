import { Request, Response, NextFunction } from 'express';
import { getMarktondernemer } from '../makkelijkemarkt-api';
import {
    getMarkten,
    getMarktProperties,
    getOndernemerVoorkeuren,
    getAanmeldingenByOndernemer,
    getToewijzingenByOndernemer,
} from '../pakjekraam-api';
import { errorPage, getQueryErrors } from '../express-util';
import { tomorrow, nextWeek } from '../util';
// import { promises } from 'fs';

export const vendorDashboardPage = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) => {

    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(erkenningsNummer);

    const marktenPromise = getMarkten()
        .then(markten => {
            const marktenMetProperties = markten.map(markt => {
                return getMarktProperties(String(markt.id)).then(props => ({
                    ...markt,
                    ...props,
                }));
            });
            return Promise.all(marktenMetProperties);
        });

    Promise.all([
        ondernemerPromise,
        marktenPromise,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(erkenningsNummer),
        getToewijzingenByOndernemer(erkenningsNummer)
    ])
        .then(
            ([ondernemer, markten, plaatsvoorkeuren, aanmeldingen, toewijzingen]) => {

                res.render('OndernemerDashboard', {
                    ondernemer,
                    aanmeldingen,
                    markten,
                    plaatsvoorkeuren,
                    startDate: tomorrow(),
                    endDate: nextWeek(),
                    messages,
                    toewijzingen,
                    eggie: req.query.eggie || false,
                });
            },
            err => errorPage(res, err),
        )
        .catch(next);
};

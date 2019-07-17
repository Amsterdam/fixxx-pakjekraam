import { Request, Response } from 'express';
import { getMarktondernemer } from '../makkelijkemarkt-api';
import {
    getMarkten,
    getMarktProperties,
    getOndernemerVoorkeuren,
    getAanmeldingenByOndernemer,
} from '../pakjekraam-api';
import { errorPage, getQueryErrors } from '../express-util';
import { tomorrow, nextWeek } from '../util';

export const vendorDashboardPage = (req: Request, res: Response, erkenningsNummer: string) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(req.session.token, erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(erkenningsNummer);
    const marktenPromise = getMarkten(req.session.token);
    const marktenPromiseProps = marktenPromise.then(markten => {
        const propsPromise = markten.map(markt => {
            return getMarktProperties(String(markt.id)).then(props => ({
                ...markt,
                ...props,
            }));
        });

        return Promise.all(propsPromise);
    });
    Promise.all([
        ondernemerPromise,
        marktenPromiseProps,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(erkenningsNummer),
    ]).then(
        ([ondernemer, markten, plaatsvoorkeuren, aanmeldingen]) => {
            res.render('OndernemerDashboard', {
                ondernemer,
                aanmeldingen,
                markten,
                plaatsvoorkeuren,
                startDate: tomorrow(),
                endDate: nextWeek(),
                messages,
                user: req.session.token,
            });
        },
        err => errorPage(res, err),
    );
};

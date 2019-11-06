import * as React from 'react';
import { Request, Response } from 'express';
import EmailWijzigingAanmeldingen from '../views/EmailWijzigingAanmeldingen.jsx';
import { internalServerErrorPage } from '../express-util';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getAanmeldingenByOndernemerEnMarkt } from '../pakjekraam-api';
import { filterRsvpList, isVast } from '../domain-knowledge.js';
import { mail } from '../mail.js';

export const applicationMailPage = (req: Request, res: Response) => {
    const ondernemerPromise = getMarktondernemer(req.params.erkenningsNummer);
    const marktPromise = getMarkt(req.params.marktId);
    const aanmeldingenPromise = getAanmeldingenByOndernemerEnMarkt(req.params.marktId, req.params.erkenningsNummer);
    Promise.all([ondernemerPromise, marktPromise, aanmeldingenPromise]).then(([ondernemer, markt, aanmeldingen]) => {
        const marktDate = new Date(req.params.marktDate);
        const aanmeldingenFiltered = filterRsvpList(aanmeldingen, markt, marktDate);
        const subject = `Markt ${markt.naam} - ${
            isVast(ondernemer.status) ? 'aanwezigheid wijziging' : 'aanmelding wijziging'
        }`;
        const props = {
            markt,
            marktDate,
            ondernemer,
            aanmeldingen: aanmeldingenFiltered,
            eggie: req.query.eggie || false,
        };
        res.render('EmailWijzigingAanmeldingen', props);

        if (req.query.mailto) {
            const to = req.query.mailto;
            mail({
                from: to,
                to,
                subject,
                react: <EmailWijzigingAanmeldingen {...props} />,
            }).then(
                () => {
                    console.log(`E-mail is verstuurd naar ${to}`);
                },
                (err: Error) => {
                    console.error(`E-mail sturen naar ${to} is mislukt`, err);
                },
            );
        }
    }, internalServerErrorPage);
};

import * as React from 'react';
import { Request, Response } from 'express';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getVoorkeurenMarktOndern } from '../pakjekraam-api';
import EmailWijzigingVoorkeuren from '../views/EmailWijzigingVoorkeuren.jsx';
import { internalServerErrorPage } from '../express-util';
import { mail } from '../mail.js';
import { groupBy } from '../util';

export const preferencesMailPage = (req: Request, res: Response) => {
    const ondernemerPromise = getMarktondernemer(req.params.erkenningsNummer);
    const marktPromise = getMarkt(req.params.marktId);
    const voorkeurenPromise = getVoorkeurenMarktOndern(req.params.marktId, req.params.erkenningsNummer);
    Promise.all([ondernemerPromise, marktPromise, voorkeurenPromise]).then(([ondernemer, markt, voorkeuren]) => {
        const marktDate = new Date(req.params.marktDate);
        const subject = `Markt ${markt.naam} - plaatsvoorkeur wijziging`;

        const voorkeurenObjPrio = groupBy(voorkeuren || [], 'priority');
        const voorkeurenPrio = Object.keys(voorkeurenObjPrio)
            .map(key => voorkeurenObjPrio[key])
            .sort((a, b) => b[0].priority - a[0].priority)
            .map(voorkeurList => voorkeurList.map(voorkeur => voorkeur.plaatsId));

        const props = { ondernemer, markt, voorkeuren: voorkeurenPrio, marktDate, eggie: req.query.eggie || false };

        res.render('EmailWijzigingVoorkeuren', props);

        if (req.query.mailto) {
            const to = req.query.mailto;
            mail({
                from: to,
                to,
                subject,
                react: <EmailWijzigingVoorkeuren {...props} />,
            }).then(
                () => {
                    console.log(`E-mail is verstuurd naar ${to}`);
                },
                (err: Error) => {
                    console.error(`E-mail sturen naar ${to} is mislukt`, err);
                },
            );
        }
    }, internalServerErrorPage(res));
};

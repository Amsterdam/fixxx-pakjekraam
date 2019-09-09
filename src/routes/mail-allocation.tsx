import * as React from 'react';
import { Request, Response } from 'express';
import { getMailContext, getMarktInfo } from '../pakjekraam-api';
import { EmailIndeling } from '../views/EmailIndeling';
import { internalServerErrorPage } from '../express-util';
import { mail } from '../mail.js';
import { formatDate } from '../util';

export const allocationMailPage = (req: Request, res: Response) => {

    const mailContextPromise = getMailContext(
        req.params.marktId,
        req.params.erkenningsNummer,
        req.params.marktDate,
    );

    const marktInfoPromixe = getMarktInfo(req.params.marktId);

    Promise.all([mailContextPromise, marktInfoPromixe])
        .then(
            ([context, marktInfo]) => {

                const subject = `Marktindeling ${context.markt.naam} ${formatDate(context.marktDate)}`;
                const props = {
                    ...context,
                    subject,
                    eggie: req.query.eggie || false,
                    ...marktInfo,
                };
                res.render('EmailIndeling.tsx', props);

                if (req.query.mailto) {
                    const to = req.query.mailto;
                    mail({
                        from: to,
                        to,
                        subject,
                        react: <EmailIndeling {...props} />,
                    }).then(
                        () => {
                            console.log(`E-mail is verstuurd naar ${to}`);
                        },
                        (err: Error) => {
                            console.error(`E-mail sturen naar ${to} is mislukt`, err);
                        },
                    );
                }

            },
            err => internalServerErrorPage(res)(err),
        );
};

import * as React from 'react';
import { Request, Response } from 'express';
import { getMailContext } from '../pakjekraam-api';
import { EmailIndeling } from '../views/EmailIndeling';
import { internalServerErrorPage } from '../express-util';
import { mail } from '../mail.js';
import { formatDate } from '../util';

export const allocationMailPage = (req: Request, res: Response) => {
    const mailContextPromise = getMailContext(
        req.session.token,
        req.params.marktId,
        req.params.erkenningsNummer,
        req.params.marktDate,
    );

    mailContextPromise.then(context => {
        const subject = `Marktindeling ${context.markt.naam} ${formatDate(context.marktDate)}`;
        const props = {
            ...context,
            subject,
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
    }, internalServerErrorPage(res));
};

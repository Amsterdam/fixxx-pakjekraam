import { Request, Response } from 'express';
import { getMarktondernemer } from '../makkelijkemarkt-api';
import { HTTP_PAGE_NOT_FOUND, httpErrorPage } from '../express-util';
import * as qs from 'qs';

export const activationQRPage = (req: Request, res: Response) => {
    getMarktondernemer(req.session.token, req.params.erkenningsNummer).then(ondernemer => {
        const params = {
            username: req.params.erkenningsNummer,
            code: ondernemer.pasUid,
        };

        const activationURL = `${req.protocol}://${req.headers.host}/activeren${qs.stringify(params, {
            addQueryPrefix: true,
        })}`;

        /*
         * FIXME: The <QRCode> React component doesn't output the `xmlns` attribute,
         * image only get's displayed as `text/html`.
         */
        res.set({
            // 'Content-Type': 'image/svg+xml; charset=UTF-8',
        });

        res.render('QRCodeImage', {
            value: activationURL,
        });
    }, httpErrorPage(res, HTTP_PAGE_NOT_FOUND));
};

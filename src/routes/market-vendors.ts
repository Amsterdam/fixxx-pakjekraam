import { Request, Response, NextFunction } from 'express';
import { getIndelingslijstInput, getSollicitantenlijstInput, getVoorrangslijstInput } from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

export const vasteplaatshoudersPage = (req: Request, res: Response) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getIndelingslijstInput(req.session.token, req.params.marktId, datum).then(data => {
        res.render('VastplaatshoudersPage', { data, datum, type, user });
    }, internalServerErrorPage(res));
};

export const sollicitantenPage = (req: Request, res: Response) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'sollicitanten';
    getSollicitantenlijstInput(req.session.token, req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, user });
        },
        internalServerErrorPage(res),
    );
};

export const voorrangslijstPage = (req: Request, res: Response, next: NextFunction ) => {
    const user = req.session;
    const datum = req.params.datum;
    const type = req.query.type === 'wenperiode' ? 'wenperiode' : 'voorrangslijst';
    getVoorrangslijstInput(req.session.token, req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt, toewijzingen, aLijst, algemenevoorkeuren }) => {
            const ondernemersFiltered =
                type === 'wenperiode' ? ondernemers.filter(ondernemer => ondernemer.status !== 'vpl') : ondernemers;
            const toewijzingenOptional = type === 'wenperiode' ? [] : toewijzingen;
            res.render('VoorrangslijstPage', {
                ondernemers: ondernemersFiltered,
                aanmeldingen,
                voorkeuren,
                aLijst,
                markt,
                datum,
                type,
                user,
                toewijzingen: toewijzingenOptional,
                algemenevoorkeuren,
            });
        },
        next,
    ).catch(next);
};

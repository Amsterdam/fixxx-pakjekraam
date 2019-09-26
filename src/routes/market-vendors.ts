import { Request, Response, NextFunction } from 'express';
import { getIndelingslijstInput, getSollicitantenlijstInput, getVoorrangslijstInput, getToewijzingslijst } from '../pakjekraam-api';
import { internalServerErrorPage, HTTP_INTERNAL_SERVER_ERROR, httpErrorPage } from '../express-util';
// import { Voorkeur } from '../model/voorkeur.model';

import Indeling from '../allocation/indeling';

export const vasteplaatshoudersPage = (req: Request, res: Response) => {
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getIndelingslijstInput(req.params.marktId, datum).then(data => {
        res.render('VastplaatshoudersPage', { data, datum, type });
    }, internalServerErrorPage(res));
};

export const sollicitantenPage = (req: Request, res: Response) => {
    const datum = req.params.datum;
    const type = 'sollicitanten';
    getSollicitantenlijstInput(req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type });
        },
        internalServerErrorPage(res),
    );
};

export const afmeldingenVasteplaatshoudersPage = (req: Request, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    const getToewijzingslijstPromise = getToewijzingslijst(marktId, datum);
    // const getVoorkeuren = Voorkeur.findAll({ where: { marktId }, raw: true });

    Promise.all([
        getToewijzingslijstPromise
    ])
        .then(
            ([data]) => {

                const { ondernemers, aanmeldingen } = data;
                const vasteplaatshouders = ondernemers.filter(ondernemer => ondernemer.status === 'vpl');
                const vasteplaatshoudersAfwezig = vasteplaatshouders.filter( ondernemer => {
                    return !Indeling.isAanwezig(ondernemer, aanmeldingen, new Date(datum));
                });

                res.render('AfmeldingenVasteplaatshoudersPage', {
                    data,
                    vasteplaatshoudersAfgemeld: vasteplaatshoudersAfwezig,
                    markt: data.markt,
                    datum,
                });
            },
            err => httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR)(err),
        )
        .catch(next);
};


export const voorrangslijstPage = (req: Request, res: Response, next: NextFunction) => {
    const datum = req.params.datum;
    const type = req.query.type === 'wenperiode' ? 'wenperiode' : 'voorrangslijst';
    getVoorrangslijstInput(req.params.marktId, req.params.datum).then(
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
                toewijzingen: toewijzingenOptional,
                algemenevoorkeuren,
            });
        },
        next,
    ).catch(next);
};

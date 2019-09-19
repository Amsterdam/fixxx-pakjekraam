import { Request, Response, NextFunction } from 'express';
import { getIndelingslijstInput, getSollicitantenlijstInput, getVoorrangslijstInput, getToewijzingslijst } from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

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


export const afmeldingenVasteplaatshoudersPage = (req: Request, res: Response, next: NextFunction ) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    getToewijzingslijst(marktId, datum)
        .then( data => {

            const vasteplaatshouders = data.ondernemers.filter( ondernemer => ondernemer.status === 'vpl');

            const vasteplaatshoudersByErkenningsNummer = vasteplaatshouders.map( ondernemer => ondernemer.erkenningsNummer);
            const afmeldingenVastplaatshouders = data.aanmeldingen.filter( aanmelding => {
                return aanmelding.attending === false && vasteplaatshoudersByErkenningsNummer.includes(aanmelding.erkenningsNummer);
            });

            const vasteplaatshoudersAfgemeld =
                (afmeldingenVastplaatshouders.length === 0) ? [] : afmeldingenVastplaatshouders.map( afmelding => {
                    const ondernemer = vasteplaatshouders.find( ondernemer => {
                        return ondernemer.erkenningsNummer === afmelding.erkenningsNummer;
                    });
                    return ondernemer;
                });

            res.render('AfmeldingenVasteplaatshoudersPage', {
                data,
                vasteplaatshoudersAfgemeld,
                markt: data.markt,
                datum,
            });
        },
        next,
    ).catch(next);
};


export const voorrangslijstPage = (req: Request, res: Response, next: NextFunction ) => {
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

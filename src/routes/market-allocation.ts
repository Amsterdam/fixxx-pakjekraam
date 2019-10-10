import { Request, Response } from 'express';
import {
    getAanmeldingen,
    getIndelingslijst,
    // getToewijzingslijst,
    getToewijzingen,
    getMarktPaginas,
    getMarktGeografie,
    getMarktplaatsen,
    getPlaatsvoorkeuren,
} from '../pakjekraam-api';
import {
    getMarkt,
} from '../makkelijkemarkt-api';
import { internalServerErrorPage } from '../express-util';
import { getOndernemersByMarkt } from '../model/ondernemer.functions';

export const getIndelingslijstData = (marktId: string, marktDate: string) =>
    Promise.all([
        getOndernemersByMarkt(marktId),
        getAanmeldingen(marktId, marktDate),
        getMarkt(marktId),
        getMarktPaginas(marktId),
        getToewijzingen(marktId, marktDate),
        getMarktGeografie(marktId),
        getMarktplaatsen(marktId),
        getPlaatsvoorkeuren(marktId),
    ]).then( result => {
        const [
            ondernemers,
            aanmeldingen,
            markt,
            paginas,
            toewijzingen,
            geografie,
            marktplaatsen,
            voorkeuren,
        ] = result;
        console.log(toewijzingen);
        return {
            ondernemers,
            aanmeldingen,
            markt,
            paginas,
            toewijzingen,
            obstakels: geografie.obstakels || [],
            marktplaatsen,
            voorkeuren,
        };
    });

export const indelingslijstPage = (req: Request, res: Response) => {
    const { marktDate } = req.params;
    const type = 'concept-indelingslijst';
    getIndelingslijst(req.params.marktId, marktDate).then(data => {
        res.render('IndelingslijstPage.tsx', { ...data, datum: marktDate, type });
    }, internalServerErrorPage(res));
};

export const marketAllocationPage = (req: Request, res: Response) => {

    const { marktDate } = req.params;
    const type = req.query.type === 'wenperiode' ? 'wenperiode' : 'indelingslijst';

    getIndelingslijstData(req.params.marktId, marktDate).then(data => {
        res.render('IndelingslijstPage.tsx', { ...data, datum: marktDate, type });
    }, internalServerErrorPage(res));

};


export const indelingPage = (req: Request, res: Response) => {

    const { marktDate } = req.params;

    // getIndelingslijstData(req.params.marktId, marktDate)
    getIndelingslijstData(req.params.marktId, marktDate)
        .then(data => {
            console.log(data);
            res.render('IndelingslijstPage.tsx', { ...data, datum: marktDate, type: 'indeling' });
        }, internalServerErrorPage(res));

};

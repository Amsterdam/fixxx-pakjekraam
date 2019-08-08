import { Request, Response } from 'express';
import { getIndelingslijst, getToewijzingslijst } from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

export const indelingslijstPage = (req: Request, res: Response) => {
    const { marktDate } = req.params;
    const type = 'concept-indelingslijst';
    getIndelingslijst(req.params.marktId, marktDate).then(data => {
        res.render('IndelingslijstPage.tsx', { data, datum: marktDate, type });
    }, internalServerErrorPage(res));
};

export const marketAllocationPage = (req: Request, res: Response) => {
    const { marktDate } = req.params;
    const type = req.query.type === 'wenperiode' ? 'wenperiode' : 'indelingslijst';

    getToewijzingslijst(req.params.marktId, marktDate).then(data => {
        res.render('IndelingslijstPage.tsx', { data, datum: marktDate, type });
    }, internalServerErrorPage(res));
};

import { Request, Response } from 'express';
import { getIndelingslijst, getToewijzingslijst } from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

export const indelingslijstPage = (req: Request, res: Response) => {
    const user = req.session.token;
    const { marktDate } = req.params;
    const type = 'concept-indelingslijst';
    getIndelingslijst(req.session.token, req.params.marktId, marktDate).then(data => {
        res.render('IndelingslijstPage.tsx', { data, datum: marktDate, type, user });
    }, internalServerErrorPage(res));
};

export const marketAllocationPage = (req: Request, res: Response) => {
    const user = req.session.token;
    const { marktDate } = req.params;
    const type = req.query.type === 'wenperiode' ? 'wenperiode' : 'indelingslijst';

    getToewijzingslijst(req.session.token, req.params.marktId, marktDate).then(data => {
        res.render('IndelingslijstPage.tsx', { data, datum: marktDate, type, user });
    }, internalServerErrorPage(res));
};

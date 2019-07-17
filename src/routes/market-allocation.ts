import { Request, Response } from 'express';
import { getIndelingslijst } from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

export const indelingslijstPage = (req: Request, res: Response) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'indelingslijst';
    getIndelingslijst(req.session.token, req.params.marktId, datum).then(data => {
        res.render('IndelingslijstPage', { data, datum, type, user });
    }, internalServerErrorPage(res));
};

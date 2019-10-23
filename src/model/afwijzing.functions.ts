import { IMarkt } from 'markt.model';
import { Afwijzing } from '../model/afwijzing.model';
import { afwijzing } from '../model/index';

export const convertAfwijzingForDB = (afwijzing: any, markt: IMarkt, marktDate: string) => {
    return {
        ...afwijzing,
        reasonCode: afwijzing.reason.code,
        erkenningsNummer: afwijzing.ondernemer.erkenningsNummer,
        marktId: markt.marktId,
        marktDate,
    };
};


export const getAfwijzingen = (marktId: string, marktDate: string): Promise<any[]> =>
    afwijzing
        .findAll<Afwijzing>({
            where: { marktId, marktDate },
            raw: true,
        });

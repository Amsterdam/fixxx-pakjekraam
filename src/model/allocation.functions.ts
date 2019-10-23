import { allocation as Allocation } from './index';
import { IToewijzing, IMarkt } from 'markt.model';

export const deleteAllocationsByErkenningsnummer = (erkenningsNummer: string) =>
    Allocation.destroy({ where: { erkenningsNummer } });

export const convertToewijzingForDB = (toewijzing: IToewijzing[], markt: IMarkt, marktDate: string) => {
    return {
        ...toewijzing,
        marktId: markt.marktId,
        marktDate,
    };
};


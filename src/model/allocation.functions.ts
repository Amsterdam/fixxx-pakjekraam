import { allocation as Allocation } from './index';

export const deleteAllocationsByErkenningsnummer = (erkenningsNummer: string) =>
    Allocation.destroy({ where: { erkenningsNummer } });

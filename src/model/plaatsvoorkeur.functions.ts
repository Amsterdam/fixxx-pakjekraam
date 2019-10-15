import { plaatsvoorkeur as Plaatsvoorkeur } from './index';

export const deletePlaatsvoorkeurenByErkenningsnummer = (erkenningsNummer: string) =>
    Plaatsvoorkeur.destroy({ where: { erkenningsNummer } });

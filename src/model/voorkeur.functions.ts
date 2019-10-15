import { voorkeur as Voorkeur } from './index';

export const deleteVoorkeurenByErkenningsnummer = (erkenningsNummer: string) =>
    Voorkeur.destroy({ where: { erkenningsNummer } });

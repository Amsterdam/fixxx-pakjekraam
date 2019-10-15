import { rsvp as Rsvp } from './index';

export const deleteRsvpsByErkenningsnummer = (erkenningsNummer: string) =>
    Rsvp.destroy({ where: { erkenningsNummer } });

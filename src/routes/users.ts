import { Request, Response } from 'express';
import { deleteAllocationsByErkenningsnummer } from '../model/allocation.functions';
import { deletePlaatsvoorkeurenByErkenningsnummer } from '../model/plaatsvoorkeur.functions';
import { deleteRsvpsByErkenningsnummer } from '../model/rsvp.functions';
import { deleteVoorkeurenByErkenningsnummer } from '../model/voorkeur.functions';

export const deleteUserPage = ( req: Request, res: Response, result: string, error: string ) => {
    return res.render('DeleteUserPage', { result, error });
};

export const deleteUser = (req: Request, res: Response, erkenningsNummer: string) => {
    Promise.all([
        deleteAllocationsByErkenningsnummer(erkenningsNummer),
        deletePlaatsvoorkeurenByErkenningsnummer(erkenningsNummer),
        deleteRsvpsByErkenningsnummer(erkenningsNummer),
        deleteVoorkeurenByErkenningsnummer(erkenningsNummer)
    ])
    .then( (result) => {
        const numberOfRecordsFound = result.reduce((a,b) => a + b, 0);
        deleteUserPage(req, res, `${numberOfRecordsFound} records mbt registratienummer '${req.body.erkenningsNummer}' verwijderd`, null);
    })
    .catch( ( e: string ) => {
        deleteUserPage(req, res, null, e);
        throw new Error(e);
    });

};


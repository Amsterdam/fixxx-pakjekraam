import { Request, Response, NextFunction } from 'express';
import {
    getIndelingslijstInput,
    getSollicitantenlijstInput,
    getVoorrangslijstInput,
    getToewijzingslijst,
    getMarktondernemersByMarkt,
    getIndelingVoorkeuren,
} from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

import Indeling from '../allocation/indeling';

import { KeycloakRoles } from '../permissions';
import { GrantedRequest } from 'keycloak-connect';
import { getKeycloakUser } from '../keycloak-api';

import { getMarkt } from '../model/markt.functions';
import { filterOndernemersAangemeld } from '../model/ondernemer.functions';
import { getAanmeldingenByMarktAndDate } from '../model/rsvp.functions';
import { getToewijzingenByMarktAndDate } from '../model/allocation.functions';
import { getPlaatsvoorkeurenByMarkt } from '../model/plaatsvoorkeur.functions';

export const vasteplaatshoudersPage = (req: GrantedRequest, res: Response) => {
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getIndelingslijstInput(req.params.marktId, datum).then((data: any) => {
        res.render('VastplaatshoudersPage', {
            data,
            datum,
            type,
            role: KeycloakRoles.MARKTMEESTER,
            user: getKeycloakUser(req)
        });
    }, internalServerErrorPage(res));
};

export const sollicitantenPage = (req: Request, res: Response) => {
    const datum = req.params.datum;
    const type = 'sollicitanten';
    const role = KeycloakRoles.MARKTMEESTER;
    getSollicitantenlijstInput(req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, role });
        },
        internalServerErrorPage(res),
    );
};

export const afmeldingenVasteplaatshoudersPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    getToewijzingslijst(marktId, datum)
        .then( data => {
                const { ondernemers, aanmeldingen } = data;
                const vasteplaatshouders = ondernemers.filter(ondernemer => ondernemer.status === 'vpl');
                const vasteplaatshoudersAfwezig = vasteplaatshouders.filter( ondernemer => {
                    return !Indeling.isAanwezig(ondernemer, aanmeldingen, new Date(datum));
                });

                const role = KeycloakRoles.MARKTMEESTER;

                res.render('AfmeldingenVasteplaatshoudersPage', {
                    data,
                    vasteplaatshoudersAfgemeld: vasteplaatshoudersAfwezig,
                    markt: data.markt,
                    datum,
                    role,
                    user: getKeycloakUser(req)
                });
            },
            internalServerErrorPage(res),
        )
        .catch(next);
};


export const voorrangslijstPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;

    getVoorrangslijstInput(req.params.marktId, req.params.datum).then( result => {

            let { ondernemers } = result;
            const { aanmeldingen, voorkeuren, markt, toewijzingen, aLijst, algemenevoorkeuren } = result;

            ondernemers = markt.kiesJeKraamFase === 'wenperiode' ? ondernemers.filter(ondernemer => ondernemer.status !== 'vpl') : ondernemers;
            const toewijzingenOptional = markt.kiesJeKraamFase === 'wenperiode' ? [] : toewijzingen;

            ondernemers.map(ondernemer => {
                ondernemer.voorkeur = algemenevoorkeuren.find(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer);
                return ondernemer;
            });

            ondernemers = ondernemers.filter( ondernemer => {
                if (ondernemer.voorkeur) {
                    return !ondernemer.voorkeur.absentFrom && !ondernemer.voorkeur.absentUntil;
                } else {
                    return true;
                }
            });

            const role = KeycloakRoles.MARKTMEESTER;
            const type = markt.kiesJeKraamFase;

            res.render('VoorrangslijstPage', {
                ondernemers,
                aanmeldingen,
                voorkeuren,
                aLijst,
                markt,
                datum,
                type,
                toewijzingen: toewijzingenOptional,
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req)
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const ondernemersNietIngedeeldPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getMarktondernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getMarkt(marktId),
        getToewijzingenByMarktAndDate(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, markt, toewijzingen, algemenevoorkeuren]) => {

            const role = KeycloakRoles.MARKTMEESTER;

            res.render('OndernemersNietIngedeeldPage', {
                ondernemers,
                aanmeldingen,
                markt,
                datum,
                toewijzingen,
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req)
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};


export const voorrangslijstVolledigPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;

    getVoorrangslijstInput(req.params.marktId, req.params.datum).then( result => {

            const { ondernemers, aanmeldingen, voorkeuren, markt, aLijst, algemenevoorkeuren } = result;
            const ondernemersFiltered = ondernemers.filter(ondernemer => ondernemer.status !== 'vpl');
            // const toewijzingenOptional = markt.fase === 'wenperiode' ? [] : toewijzingen;

            const type = 'wenperiode';
            const role = KeycloakRoles.MARKTMEESTER;

            res.render('VoorrangslijstPage', {
                ondernemers: ondernemersFiltered,
                aanmeldingen,
                voorkeuren,
                aLijst,
                markt,
                datum,
                type,
                toewijzingen: [],
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req)
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const alleSollicitantenPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getMarktondernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getPlaatsvoorkeurenByMarkt(marktId),
        getMarkt(marktId),
        getToewijzingenByMarktAndDate(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {
            const role = KeycloakRoles.MARKTMEESTER;
            res.render('AanwezigheidLijst', {
                ondernemers: ondernemers.filter(ondernemer => ondernemer.status !== 'vpl' ),
                aanmeldingen,
                plaatsvoorkeuren,
                toewijzingen,
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                algemenevoorkeuren,
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const sollicitantentAanwezigheidLijst = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getMarktondernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getPlaatsvoorkeurenByMarkt(marktId),
        getMarkt(marktId),
        getToewijzingenByMarktAndDate(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {

            const role = KeycloakRoles.MARKTMEESTER;
            res.render('AanwezigheidLijstPage', {
                ondernemers: ondernemers.filter(ondernemer => ondernemer.status !== 'vpl' ),
                aanmeldingen,
                plaatsvoorkeuren,
                toewijzingen,
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                algemenevoorkeuren,
                title: 'Alle sollicitanten'
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const alleOndernemersAanwezigheidLijst = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getMarktondernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getPlaatsvoorkeurenByMarkt(marktId),
        getMarkt(marktId),
        getToewijzingenByMarktAndDate(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {

            const role = KeycloakRoles.MARKTMEESTER;
            res.render('AanwezigheidLijst', {
                ondernemers,
                aanmeldingen,
                plaatsvoorkeuren,
                toewijzingen,
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                algemenevoorkeuren,
                title: 'Alle ondernemers'
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};


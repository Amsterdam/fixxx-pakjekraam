import { Request, Response, NextFunction } from 'express';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import {
    getIndelingVoorkeur,
    getMarktplaatsen,
    getMarktPaginas,
    getMarktProperties,
    getOndernemerVoorkeuren,
} from '../pakjekraam-api';
import { getQueryErrors, internalServerErrorPage, HTTP_CREATED_SUCCESS } from '../express-util';
import { upsert } from '../sequelize-util.js';
import { IPlaatsvoorkeurRow } from '../markt.model';
import models from '../model/index';

export const marketLocationPage = (
    req: Request,
    res: Response,
    token: string,
    erkenningsNummer: string,
    query: any,
    currentMarktId: string,
    role: string,
) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(token, erkenningsNummer);
    const marktenPromise = ondernemerPromise
        .then(ondernemer =>
            Promise.all(
                ondernemer.sollicitaties
                    .filter(sollicitatie => !sollicitatie.doorgehaald)
                    .map(sollicitatie => String(sollicitatie.markt.id))
                    .map(marktId => getMarkt(token, marktId)),
            ),
        )
        .then(markten =>
            Promise.all(
                (currentMarktId ? markten.filter(markt => String(markt.id) === currentMarktId) : markten).map(markt =>
                    getMarktplaatsen(String(markt.id)).then(marktplaatsen => ({
                        ...markt,
                        marktplaatsen,
                    })),
                ),
            ),
        );

    Promise.all([
        ondernemerPromise,
        marktenPromise,
        getOndernemerVoorkeuren(erkenningsNummer),
        getMarktPaginas(currentMarktId),
        getMarktProperties(currentMarktId),
        getMarktplaatsen(currentMarktId),
        getIndelingVoorkeur(erkenningsNummer, currentMarktId),
    ]).then(
        ([ondernemer, markten, plaatsvoorkeuren, marktPaginas, marktProperties, marktPlaatsen, indelingVoorkeur]) => {
            res.render('VoorkeurenPage', {
                ondernemer,
                markten,
                plaatsvoorkeuren,
                marktPaginas,
                marktProperties,
                marktPlaatsen,
                indelingVoorkeur,
                query,
                // user: req.user,
                messages,
                role,
            });
        },
        err => internalServerErrorPage(res)(err),
    );
};

const voorkeurenFormDataToObject = (formData: any): IPlaatsvoorkeurRow => ({
    marktId: formData.marktId,
    erkenningsNummer: formData.erkenningsNummer,
    plaatsId: formData.plaatsId,
    priority: parseInt(formData.priority, 10),
});

export const updateMarketLocation = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) => {
    /*
     * TODO: Form data format validation
     * TODO: Business logic validation
     */

    const { redirectTo } = req.body;

    const removeExisting = () =>
        models.plaatsvoorkeur
            .destroy({
                where: {
                    erkenningsNummer,
                },
            })
            .then(n => console.log(`${n} Bestaande voorkeuren verwijderd...`));

    const ignoreEmptyVoorkeur = (voorkeur: IPlaatsvoorkeurRow) => !!voorkeur.plaatsId;

    const insertFormData = () => {
        console.log(`${req.body.plaatsvoorkeuren.length} (nieuwe) voorkeuren opslaan...`);

        const voorkeuren = req.body.plaatsvoorkeuren
            .map(voorkeurenFormDataToObject)
            .map(
                (plaatsvoorkeur: IPlaatsvoorkeurRow): IPlaatsvoorkeurRow => ({
                    ...plaatsvoorkeur,
                    erkenningsNummer,
                }),
            )
            .filter(ignoreEmptyVoorkeur);

        return models.plaatsvoorkeur.bulkCreate(voorkeuren);
    };

    const insertAlgVoorkeurFormData = () => {
        console.log('algemene voorkeuren opslaan...');

        return upsert(
            models.voorkeur,
            {
                erkenningsNummer,
                marktDate: req.body.marktDate || null,
                marktId: req.body.marktId,
            },
            {
                anywhere: !!req.body.anywhere,
            },
        );
    };

    // TODO: Remove and insert in one transaction
    removeExisting()
        .then(insertFormData)
        .then(insertAlgVoorkeurFormData)
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(redirectTo),
            error => internalServerErrorPage(res)(error),
        );
};

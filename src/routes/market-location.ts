import { Request, Response, NextFunction } from 'express';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import {
    getIndelingVoorkeur,
    getMarktplaatsen,
    getPlaatsvoorkeurenOndernemer,
    getMededelingen,
} from '../pakjekraam-api';
import { getQueryErrors, internalServerErrorPage, HTTP_CREATED_SUCCESS } from '../express-util';
import { upsert } from '../sequelize-util.js';
import { IPlaatsvoorkeurRow } from '../markt.model';
import { getMarktEnriched } from '../model/markt.functions';
import models from '../model/index';

export const marketLocationPage = (
    req: Request,
    res: Response,
    erkenningsNummer: string,
    query: any,
    currentMarktId: string,
    role: string,
    csrfToken: string,
) => {

    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(erkenningsNummer);
    const marktenPromise = ondernemerPromise
        .then(ondernemer =>
            Promise.all(
                ondernemer.sollicitaties
                    .filter(sollicitatie => !sollicitatie.doorgehaald)
                    .map(sollicitatie => String(sollicitatie.markt.id))
                    .map(marktId => getMarkt(marktId)),
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
        getPlaatsvoorkeurenOndernemer(erkenningsNummer),
        getIndelingVoorkeur(erkenningsNummer, currentMarktId),
        getMarktEnriched(currentMarktId),
        getMededelingen(),
    ]).then(
        ([ondernemer, markten, plaatsvoorkeuren, indelingVoorkeur, markt, mededelingen]) => {
            const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id && !soll.doorgehaald);
            res.render('VoorkeurenPage', {
                ondernemer,
                markten,
                plaatsvoorkeuren,
                marktPaginas: markt.paginas,
                marktPlaatsen: markt.plaatsen,
                indelingVoorkeur,
                query,
                messages,
                role,
                markt,
                sollicitatie,
                mededeling: mededelingen.plaatsVoorkeuren,
                csrfToken,
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

export const updateMarketLocation = (req: Request, res: Response, next: NextFunction, marktId: string, erkenningsNummer: string) => {
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
                marktId,
            },
            {
                anywhere: !!req.body.anywhere,
                minimum: req.body.minimum,
                maximum: req.body.maximum,
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

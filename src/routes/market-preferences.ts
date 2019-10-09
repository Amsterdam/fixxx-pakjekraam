import { NextFunction, Request, Response } from 'express';
import { IMarktondernemerVoorkeurRow } from '../markt.model';
import { upsert } from '../sequelize-util.js';
import models from '../model/index';
import { internalServerErrorPage, HTTP_CREATED_SUCCESS, getQueryErrors } from '../express-util';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getAllBranches } from '../pakjekraam-api';
import { ddmmyyyyToDate } from '../util';
import { Voorkeur } from '../model/voorkeur.model';

import moment from 'moment';

export const algemeneVoorkeurenFormCheckForError = (body: any) => {
    const { absentFrom, absentUntil } = body;
    let error = null;

    if (absentUntil !== '' ) {
        if ( !moment(absentUntil, 'DD-MM-YYYY',true).isValid()) {
            error = 'Datum afwezigheid vanaf heeft niet het juiste format. Gebruik dd-mm-yyyy.';
        }
    }
    if (absentFrom !== '' ) {
        if ( !moment(absentFrom, 'DD-MM-YYYY',true).isValid()) {
            error = 'Datum afwezigheid tot en met heeft niet het juiste format. Gebruik dd-mm-yyyy.';
        }
    }
    return error;
};

export const algemeneVoorkeurenFormData = (body: any): IMarktondernemerVoorkeurRow => {

    const { absentFrom, absentUntil, erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting } = body;

    const anywhere = !!body.anywhere;
    const minimum = typeof body.minimum === 'string' ? parseInt(body.minimum, 10) || null : null;
    const maximum = typeof body.maximum === 'string' ? parseInt(body.maximum, 10) || null : null;

    let absentFromDate = null;
    let absentUntilDate = null;

    console.log(absentFrom);

    if (absentFrom) {
        absentFromDate = ddmmyyyyToDate(absentFrom);
    }

    if (absentUntil) {
        absentUntilDate = ddmmyyyyToDate(absentUntil);
    }

    const voorkeur = {
        erkenningsNummer,
        marktId: marktId || null,
        marktDate: marktDate || null,
        anywhere,
        minimum,
        maximum,
        brancheId: brancheId || null,
        parentBrancheId: parentBrancheId || null,
        inrichting: inrichting || null,
        absentFrom: absentFromDate || null,
        absentUntil: absentUntilDate || null,
    };

    return voorkeur;
};

export const updateMarketPreferences = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) => {

    const data = algemeneVoorkeurenFormData(req.body);
    const formError = algemeneVoorkeurenFormCheckForError(req.body);

    if (formError !== null) {
        return res.redirect(`./?error=${formError}`);
    }

    const { marktId } = data;

    upsert(
        models.voorkeur,
        {
            erkenningsNummer,
            marktId,
        },
        data,
    ).then(
        () => res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next ? req.body.next : '/'),
        internalServerErrorPage(res),
    );
};

export const marketPreferencesPage = (
    req: Request,
    res: Response,
    erkenningsNummer: string,
    marktId: string,
    marktDate: string,
    role: string,
) => {

    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(erkenningsNummer);
    const marktPromise = marktId ? getMarkt(marktId) : Promise.resolve(null);

    // TODO: Only allow relative URLs in `next`, to prevent redirection to 3rd party phishing sites
    const next = req.query.next;
    const query = req.query;

    Promise.all([
        ondernemerPromise,
        marktPromise,
        Voorkeur.findOne({
            where: { erkenningsNummer, marktId },
            raw: true
        }),
        getAllBranches(),
    ]).then(([ondernemer, markt, voorkeur, branches]) => {

        res.render('AlgemeneVoorkeurenPage', {
            ondernemer,
            markt,
            marktId,
            voorkeur,
            branches,
            next,
            query,
            messages,
            role,
        });

    }, internalServerErrorPage(res));
};

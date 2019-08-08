import { NextFunction, Request, Response } from 'express';
import { getMarkt, getMarktondernemer } from '../makkelijkemarkt-api';
import { getAanmeldingenByOndernemer, getConflictingApplications } from '../pakjekraam-api';
import { httpErrorPage, internalServerErrorPage, HTTP_CREATED_SUCCESS, HTTP_FORBIDDEN_ERROR } from '../express-util';
import models from '../model/index';
import { flatten, nextWeek, LF, tomorrow } from '../util';
import { IRSVP } from '../markt.model';
import { upsert } from '../sequelize-util.js';

export const marketApplicationPage = (
    res: Response,
    erkenningsNummer: string,
    marktId: string,
    query: any,
) => {
    Promise.all([
        getMarktondernemer(erkenningsNummer),
        getAanmeldingenByOndernemer(erkenningsNummer),
        getMarkt(marktId),
    ]).then(
        ([ondernemer, aanmeldingen, markt]) => {
            res.render('AanmeldPage', { ondernemer, aanmeldingen, markt, date: tomorrow() });
        },
        err => internalServerErrorPage(res)(err),
    );
};

const aanmeldFormDataToRSVP = (formData: any, erkenningsNummer: string): IRSVP => ({
    marktId: formData.marktId,
    marktDate: formData.aanmelding,
    erkenningsNummer,
    attending: true,
});

export const handleMarketApplication = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) => {
    const aanmelding = aanmeldFormDataToRSVP(req.body, erkenningsNummer);

    return getConflictingApplications(aanmelding).then(conflicts => {
        if (conflicts.length > 0) {
            // TODO: Redirect to previous page and display helpful error message
            httpErrorPage(res, HTTP_FORBIDDEN_ERROR)(
                conflicts
                    .map(
                        a =>
                            // TODO: Add human readable market name to Error, instead of ID
                            new Error(
                                `U hebt zich al aangemeld voor markt ${a.marktId} op ${
                                    a.marktDate
                                }. Inschrijven voor meerdere markten is niet mogelijk.`,
                            ),
                    )
                    .map(({ message }) => message)
                    .join(LF),
            );
        }

        models.rsvp
            .create(aanmelding)
            .then(
                () => res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next || '/'),
                (error: Error) => internalServerErrorPage(res)(String(error)),
            );
    });
};

export const attendancePage = (
    res: Response,
    erkenningsNummer: string,
    currentMarktId: string,
    query: any,
    role: string,
) => {
    const ondernemerPromise = getMarktondernemer(erkenningsNummer);
    const marktenPromise = ondernemerPromise.then(ondernemer =>
        Promise.all(
            ondernemer.sollicitaties
                .map(sollicitatie => String(sollicitatie.markt.id))
                .map(marktId => getMarkt(marktId)),
        ),
    );

    return Promise.all([ondernemerPromise, marktenPromise, getAanmeldingenByOndernemer(erkenningsNummer)]).then(
        ([ondernemer, markten, aanmeldingen]) => {
            res.render('AfmeldPage', {
                ondernemer,
                aanmeldingen,
                markten,
                startDate: tomorrow(),
                endDate: nextWeek(),
                currentMarktId,
                query,
                role,
            });
        },
        err => internalServerErrorPage(res)(err),
    );
};

export interface AttendanceUpdateFormData {
    erkenningsNummer: string;
    rsvp: {
        marktId: string;
        marktDate: string;
        attending: string;
    }[];
    next: string;
}

export const handleAttendanceUpdate = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string) => {
    const data: AttendanceUpdateFormData = req.body;
    /*
     * TODO: Form data format validation
     * TODO: Business logic validation
     */

    const responses = data.rsvp.map(
        (rsvp): IRSVP => ({
            ...rsvp,
            attending: rsvp.attending === 'true',
            erkenningsNummer,
        }),
    );

    Promise.all(responses.map(getConflictingApplications))
        .then(conflicts => conflicts.reduce(flatten, []))
        .then(conflicts => {
            if (conflicts.length > 0) {
                // TODO: Redirect to previous page and display helpful error message
                httpErrorPage(res, HTTP_FORBIDDEN_ERROR)(
                    conflicts
                        .map(
                            application =>
                                // TODO: Add human readable market name to Error, instead of ID
                                new Error(
                                    `U hebt zich al aangemeld voor markt ${application.marktId} op ${
                                        application.marktDate
                                    }. Inschrijven voor meerdere markten is niet mogelijk.`,
                                ),
                        )
                        .map(({ message }) => message)
                        .join(LF),
                );
            } else {
                // TODO: Redirect with success code
                // TODO: Use `Sequelize.transaction`
                Promise.all(
                    responses.map(response => {
                        const { marktId, marktDate } = response;

                        return upsert(
                            models.rsvp,
                            {
                                erkenningsNummer,
                                marktId,
                                marktDate,
                            },
                            response,
                        );
                    }),
                ).then(
                    () => res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next),
                    error => internalServerErrorPage(res)(String(error)),
                );
            }
        });
};

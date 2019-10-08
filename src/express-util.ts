import { Response } from 'express';
import { stringify } from 'qs';

interface ErrorMessage {
    code: string;
    message: string;
    severity: string;
}

export const HTTP_CREATED_SUCCESS = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_FORBIDDEN_ERROR = 403;
export const HTTP_PAGE_NOT_FOUND = 404;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

export const publicErrors = {
    INCORRECT_CREDENTIALS: 'incorrect-credentials',
    AANWEZIGHEID_SAVED: 'aanwezigheid-saved',
    PLAATSVOORKEUREN_SAVED: 'plaatsvoorkeuren-saved',
    ALGEMENE_VOORKEUREN_SAVED: 'algemene-voorkeuren-saved',
    ACTIVATION_FAILED: 'activation-failed',
    ACTIVATION_CODE_NOT_SET: 'activation-code-not-set',
    NON_MATCHING_PASSWORDS: 'non-matching-passwords',
    ACCOUNT_EXISTS_ALREADY: 'account-exists-already',
    ACTIVATION_CODE_INCORRECT: 'activation-code-incorrect',
    USERNAME_CONTAINS_DOT: 'username-contains-dots',
};

const humanReadableMessage = {
    [publicErrors.INCORRECT_CREDENTIALS]: 'Uw gebruikersnaam/registratienummer of wachtwoord is incorrect',
    [publicErrors.AANWEZIGHEID_SAVED]: 'Uw aan- of afmeldingen zijn bewaard',
    [publicErrors.PLAATSVOORKEUREN_SAVED]: 'Uw plaatsvoorkeuren zijn bewaard',
    [publicErrors.ALGEMENE_VOORKEUREN_SAVED]: 'Uw marktprofiel is bewaard',
    [publicErrors.ACTIVATION_FAILED]:
        'De ingevoerde activatie-code klopt niet of is verlopen. Controleer de ingevulde gegevens.',
    [publicErrors.ACTIVATION_CODE_NOT_SET]: 'U hebt geen activatie-code ingevoerd.',
    [publicErrors.NON_MATCHING_PASSWORDS]: `De ingevoerde wachtwoorden komen niet overeen.
        Let op dat u geen fout maakt bij het kiezen van een wachtwoord.`,
    [publicErrors.ACCOUNT_EXISTS_ALREADY]:
        'Er bestaat al een account met dit registratienummer.',
    [publicErrors.ACTIVATION_CODE_INCORRECT]: 'De ingevoerde activatie-code is onjuist.',
    [publicErrors.USERNAME_CONTAINS_DOT]: 'Het ingevoerde registratienummer mag geen punt bevatten.',
};

export const httpErrorPage = (res: Response, errorCode: number) => (err: Error | string) => {
    console.log(err);
    res.render('ErrorPage.jsx', { errorCode });
};

export const internalServerErrorPage = (res: Response) => httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR);

export const forbiddenErrorPage = (res: Response) => httpErrorPage(res, HTTP_FORBIDDEN_ERROR);

/*
 * Error message codes can be passed along via the query string, for example:
 *
 *     /login?error=incorrect-credentials
 *     /login?error[]=incorrect-request&error[]=database-down
 */
export const getQueryErrors = (queryParams: any): ErrorMessage[] => {
    const errorCodes: any[] = queryParams.error
        ? Array.isArray(queryParams.error)
            ? queryParams.error
            : [queryParams.error]
        : [];

    return errorCodes.map(
        (msg: any): ErrorMessage => ({
            code: msg,
            message: humanReadableMessage[msg] || msg,
            severity: 'error',
        }),
    );
};

export const errorPage = (res: Response, err: Error) => internalServerErrorPage(res)(err);

export const jsonPage = (res: Response) => (data: any) => {
    res.set({
        'Content-Type': 'application/json; charset=UTF-8',
    });
    res.send(JSON.stringify(data, null, '  '));
};

export const redirectWithParams = (res: Response, params: Object) => {
    return res.redirect(
        `${res.req.url}${stringify(
            params,
            { addQueryPrefix: true },
        )}`,
    );
};

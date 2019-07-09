import { Response } from 'express';

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
    NON_MATCHING_PASSWORDS: 'non-matching-passwords',
};

const humanReadableMessage = {
    [publicErrors.INCORRECT_CREDENTIALS]: 'Uw gebruikersnaam of wachtwoord is incorrect.',
    [publicErrors.AANWEZIGHEID_SAVED]: 'Je aan- of afmeldingen zijn met success gewijzigd.',
    [publicErrors.PLAATSVOORKEUREN_SAVED]: 'Je plaatsvoorkeuren zijn met success gewijzigd.',
    [publicErrors.ALGEMENE_VOORKEUREN_SAVED]: 'Je marktprofiel is met success gewijzigd.',
    [publicErrors.ACTIVATION_FAILED]:
        'De ingevoerde activatie-code klopt niet of is verlopen. Controleer de ingevulde gegevens.',
    [publicErrors.NON_MATCHING_PASSWORDS]: `De ingevoerde wachtwoorden komen niet overeen.
        Let op dat je geen fout maakt bij het kiezen van een wachtwoord.`,
};

export const httpErrorPage = (res: Response, errorCode: number) => (err: Error | string) => {
    console.log(err);
    res.status(errorCode).end(`${err}`);
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

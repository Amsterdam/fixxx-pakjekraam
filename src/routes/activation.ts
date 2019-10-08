import { Request, Response } from 'express';
import { checkActivationCode } from '../makkelijkemarkt-api';
import { userExists } from '../keycloak-api';
import { publicErrors, getQueryErrors, httpErrorPage, redirectWithParams } from '../express-util';

export const activationPage = (req: Request, res: Response) => {
    res.render('ActivatePage', {
        username: req.query.username,
        code: req.query.code,
        messages: getQueryErrors(req.query),
    });
};

export const handleActivation = (req: Request, res: Response) => {
    const { username, code } = req.body;

    if (username.includes('.')) {
        console.log('Username can not contains dots');
        return redirectWithParams(res, { error:publicErrors.ACTIVATION_CODE_INCORRECT, username, code });
    }

    if (!code) {
        console.log('Activatie-code is not set');
        return redirectWithParams(res, { error:publicErrors.ACTIVATION_CODE_INCORRECT, username, code });
    }

    checkActivationCode(username, code)
        .then((isValid: boolean) => {
            if (!isValid) {
                return redirectWithParams(res, { error:publicErrors.ACTIVATION_CODE_INCORRECT, username, code });
            } else {
                return isValid;
            }
        })
        .then(() => userExists(username))
        .then((isExistingUser: boolean) => {
            if (isExistingUser) {
                console.log(`User with erkenningsnummer ${username} already exists`);
                return redirectWithParams(res, { error:publicErrors.ACTIVATION_CODE_INCORRECT, username, code });
            } else {
                return isExistingUser;
            }
        })
        .then( () => {
                req.session.activation = { username };
                return res.redirect('/registreren');
            },
        )
        .catch( e => {
            httpErrorPage(res, e);
        });
};

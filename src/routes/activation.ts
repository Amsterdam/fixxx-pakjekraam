import { Request, Response } from 'express';
import { checkActivationCode } from '../makkelijkemarkt-api';
import { userExists } from '../keycloak-api';
import { publicErrors, getQueryErrors } from '../express-util';
import { stringify } from 'qs';

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
        res.redirect(
            `/activeren${stringify(
                {
                    username,
                    code,
                    error: publicErrors.USERNAME_CONTAINS_DOT,
                },
                { addQueryPrefix: true },
            )}`,
        );
    }

    if (!code) {
        console.log('Activatie-code is not set');
        res.redirect(
            `/activeren${stringify(
                {
                    username,
                    error: publicErrors.ACTIVATION_CODE_NOT_SET,
                },
                { addQueryPrefix: true },
            )}`,
        );
    }

    checkActivationCode(username, code)
        .then((isValid: boolean) => {
            if (!isValid) {
                console.log('Registratienummer and Activatie-code combination is not valid');
                // Go to the activation failed page
                throw new Error();
            }
            console.log(username);
            return isValid;
        })
        .then(() => userExists(username))
        .then((isExistingUser: boolean) => {
            console.log(isExistingUser);
            if (isExistingUser) {
                console.log('User already exists');
                // Go to the activation failed page
                res.redirect(
                    `/activeren${stringify(
                        {
                            username,
                            code,
                            error: publicErrors.ACCOUNT_EXISTS_ALREADY,
                        },
                        { addQueryPrefix: true },
                    )}`,
                );
                throw new Error();
            }
            return isExistingUser;
        })
        .then(
            () => {
                req.session.activation = {
                    username,
                };
                res.redirect('/registreren');
            },
            () => {
                res.redirect(
                    `/activeren${stringify(
                        {
                            username,
                            code,
                            error: publicErrors.ACTIVATION_FAILED,
                        },
                        { addQueryPrefix: true },
                    )}`,
                );
            },
        );
};

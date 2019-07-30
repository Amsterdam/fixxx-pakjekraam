import { Request, Response } from 'express';
import { checkActivationCode } from '../makkelijkemarkt-auth';
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

    checkActivationCode(username, code)
        .then((isValid: boolean) => {
            if (!isValid) {
                console.log('Registratienummer and Activatie-code combination is not valid');
                // Go to the activation failed page
                throw new Error();
            }

            return isValid;
        })
        .then(() => userExists(username))
        .then((isExistingUser: boolean) => {
            if (isExistingUser) {
                console.log('User already exists');
                // Go to the activation failed page
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

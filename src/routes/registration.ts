import ClientRepresentation from 'keycloak-admin/lib/defs/clientRepresentation';
import { Request, Response } from 'express';
import { getKeycloakAdmin } from '../keycloak-api';
import { forbiddenErrorPage, internalServerErrorPage, publicErrors, getQueryErrors } from '../express-util';
import { stringify } from 'qs';
import { trace } from '../util';
import { KeycloakRoles } from '../permissions';

export const registrationPage = (req: Request, res: Response) => {
    if (req.session.activation) {
        res.render('RegistrationPage', {
            code: req.session.activation.code,
            email: req.query.email,
            messages: getQueryErrors(req.query),
            username: req.session.activation.username,
        });
    } else {
        res.redirect('/activeren');
    }
};

export const handleRegistration = (req: Request, res: Response) => {
    if (req.session.activation) {
        const { password, email } = req.body;

        if (req.body.password !== req.body.passwordRepeat) {
            res.redirect(
                `/registreren${stringify(
                    { email, error: publicErrors.NON_MATCHING_PASSWORDS },
                    {
                        addQueryPrefix: true,
                    },
                )}`,
            );
        } else {
            const userDefinition = {
                username: req.session.activation.username,
                email,
                enabled: true,
            };

            getKeycloakAdmin().then(kcAdminClient => {
                // Use `as any` as workaround for incomplete TypeScript definition for `findOne` argument.
                const clientPromise = kcAdminClient.clients
                    .findOne({
                        clientId: process.env.IAM_CLIENT_ID,
                    } as any)
                    .then(
                        (clients: ClientRepresentation): ClientRepresentation => {
                            if (Array.isArray(clients)) {
                                return clients[0];
                            } else {
                                return clients;
                            }
                        },
                    );

                clientPromise.catch(() => console.warn('Unable to find Keycloak client'));
                clientPromise.catch(internalServerErrorPage(res));

                const userPromise = Promise.all([clientPromise]).then(() =>
                    kcAdminClient.users.create(userDefinition),
                );

                Promise.all([clientPromise, userPromise])
                    .then(([client, user]) => {
                        const passwordPromise = kcAdminClient.users.resetPassword({
                            id: user.id,
                            credential: {
                                temporary: false,
                                type: 'password',
                                value: password,
                            },
                        });

                        // userDefinition.email ?
                        //     // TODO: How should we handle failure here?
                        //     kcAdminClient.users
                        //         .sendVerifyEmail({
                        //             id: user.id,
                        //         })
                        //         .then(
                        //             () => console.log('Verification e-mail sent.'),
                        //             () => console.log('Failed to send verification e-mail.'),
                        //         ): null;

                        return passwordPromise.then(result => {
                            console.log('Password reset', result);
                        });
                    })
                    .then(x => {
                        delete req.session.activation;
                        res.redirect('/welkom');
                    })
                    .catch(internalServerErrorPage(res));
            });
        }
    } else {
        forbiddenErrorPage(res)('');
    }
};

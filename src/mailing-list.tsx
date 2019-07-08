import * as React from 'react';
import EmailIndeling from './views/EmailIndeling.jsx';
import { mail } from './mail.js';
import { today } from './util.js';
import { getMarkten } from './makkelijkemarkt-api';
import {
    getAanmeldingen,
    getAllBranches,
    getMarktplaatsen,
    getMarktondernemersByMarkt,
    getPlaatsvoorkeuren,
    getToewijzingen,
} from './pakjekraam-api';
import { getAllUsers } from './keycloak-api';
import { readOnlyLogin } from './makkelijkemarkt-auth';

// const React = require('react');

const marktDate = today();

const usersPromise = getAllUsers();
const makkelijkeMarktPromise = readOnlyLogin();

makkelijkeMarktPromise.then(makkelijkeMarkt =>
    getMarkten(makkelijkeMarkt.token).then(markten =>
        markten
            .filter(markt => markt.id === 20)
            .map(markt =>
                Promise.all([
                    getMarktondernemersByMarkt(makkelijkeMarkt.token, String(markt.id)),
                    getToewijzingen(String(markt.id), marktDate),
                    usersPromise,
                    getPlaatsvoorkeuren(String(markt.id)),
                    getAanmeldingen(String(markt.id), marktDate),
                    getMarktplaatsen(String(markt.id)),
                    getAllBranches(),
                ]).then(
                    ([ondernemers, toewijzingen, users, plaatsvoorkeuren, aanmeldingen, marktplaatsen, branches]) => {
                        console.log(`Verstuur mails voor de marktindeling van ${markt.id} op datum ${marktDate}`);
                        console.log('Marktondernemers', ondernemers ? ondernemers.length : 0);
                        console.log('Toewijzingen', toewijzingen ? toewijzingen.length : 0);

                        const registeredUsers = users
                            .filter(({ username }) =>
                                ondernemers.some(({ erkenningsNummer }) => erkenningsNummer === username),
                            )
                            .filter(user => !!user.email);

                        console.log(
                            'Geregistreerde marktondernemers met e-mail',
                            registeredUsers ? registeredUsers.length : 0,
                        );

                        toewijzingen
                            .map(toewijzing => {
                                const ondernemer = ondernemers.find(
                                    ({ erkenningsNummer }) => erkenningsNummer === toewijzing.erkenningsNummer,
                                );
                                const user = users.find(({ username }) => username === toewijzing.erkenningsNummer);

                                return {
                                    toewijzing,
                                    ondernemer,
                                    user,
                                };
                            })
                            .filter(({ user }) => !!user && !!user.email)
                            .map(({ ondernemer, user, toewijzing }) => {
                                const props = {
                                    markt,
                                    marktplaatsen,
                                    marktDate,
                                    ondernemer,
                                    voorkeuren: plaatsvoorkeuren,
                                    aanmeldingen,
                                    branches,
                                };

                                console.log(
                                    `Stuur e-mail naar ${user.email}! Ondernemer is ingedeeld op plaats ${
                                        toewijzing.plaatsen
                                    }`,
                                );

                                const subject = `${markt.naam} indeling voor ${marktDate}`;

                                console.log(subject);

                                const testEmail = {
                                    from: process.env.MAILER_FROM,
                                    to: user.email,
                                    subject,
                                    react: <EmailIndeling {...props} />,
                                };

                                mail(testEmail).then(
                                    () => {
                                        console.log('E-mail is verstuurd.');
                                        process.exit(0);
                                    },
                                    (err: Error) => {
                                        console.error('E-mail sturen mislukt.', err);
                                        process.exit(1);
                                    },
                                );
                            });
                    },
                ),
            ),
    ),
);

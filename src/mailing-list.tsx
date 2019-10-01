import * as React from 'react';
import { EmailIndeling } from './views/EmailIndeling';
import { defer } from 'rxjs';
import { shareReplay, tap, combineLatest } from 'rxjs/operators';
import { mail } from './mail.js';
import { requireEnv, tomorrow } from './util';
import {
    getAanmeldingen,
    getAllBranches,
    getMarktenByDate,
    getMarktplaatsen,
    getMarktondernemersByMarkt,
    getPlaatsvoorkeuren,
    getToewijzingen,
} from './pakjekraam-api';
import { retry } from './rxjs-util';
import { getAllUsers } from './keycloak-api';
import { checkLogin } from './makkelijkemarkt-api';

requireEnv('MAILER_FROM');

const marktDate = tomorrow();

const users$ = defer(() => getAllUsers()).pipe(
    tap(() => console.log('Keycloak OK!'), (e) => console.log(`Unable to connect to Keycloak: ${e}`)),
    retry(10, 5000),
    shareReplay(1),
);

const makkelijkeMarkt$ = defer(() => checkLogin()).pipe(
    tap(
        () => console.log('Makkelijke Markt API OK!'),
        () => console.log('Unable to connect to the Makkelijke Markt API'),
    ),
    retry(10, 5000),
    shareReplay(1),
);

makkelijkeMarkt$.pipe(combineLatest(users$)).subscribe(([makkelijkeMarkt, users]) =>
    getMarktenByDate(marktDate).then(markten =>
        markten
            .filter(markt => markt.id === 20)
            .map(markt =>
                Promise.all([
                    getMarktondernemersByMarkt(String(markt.id)),
                    getToewijzingen(String(markt.id), marktDate),
                    getPlaatsvoorkeuren(String(markt.id)),
                    getAanmeldingen(String(markt.id), marktDate),
                    getMarktplaatsen(String(markt.id)),
                    getAllBranches(),
                ]).then(([ondernemers, toewijzingen, plaatsvoorkeuren, aanmeldingen, marktplaatsen, branches]) => {

                    console.log(`Verstuur mails voor de marktindeling van ${markt.id} op datum ${marktDate}`);
                    console.log('Marktondernemers', ondernemers ? ondernemers.length : 0);
                    console.log('Toewijzingen', toewijzingen ? toewijzingen.length : 0);

                    const registeredUsers = users
                        .filter(({ username }) =>
                            ondernemers.some(({ erkenningsNummer }) => erkenningsNummer.replace('.','') === username.replace('.','') ),
                        )
                        .filter(user => !!user.email);

                    console.log(
                        'Geregistreerde marktondernemers met e-mail',
                        registeredUsers ? registeredUsers.length : 0,
                    );

                    toewijzingen
                        .map(toewijzing => {
                            const ondernemer = ondernemers.find(
                                ({ erkenningsNummer }) => erkenningsNummer.replace('.','') === toewijzing.erkenningsNummer.replace('.',''),
                            );
                            const user = users.find(
                                ({ username }) => username.replace('.','') === toewijzing.erkenningsNummer.replace('.','')
                            );
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
                                toewijzing,
                            };

                            console.log(
                                `Stuur e-mail naar ${user.email}! Ondernemer is ingedeeld op plaats ${
                                    toewijzing.plaatsen
                                }`,
                            );

                            const subject = `${markt.naam} indeling voor ${marktDate}`;

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
                }),
            ),
    ),
);

import * as React from 'react';
import { EmailIndeling } from './views/EmailIndeling';
import { defer } from 'rxjs';
import { shareReplay, tap, combineLatest } from 'rxjs/operators';
import { mail } from './mail.js';
import { requireEnv, tomorrow, yyyyMmDdtoDDMMYYYY } from './util';
import {
    getAanmeldingen,
    getAllBranches,
    getMarktenByDate,
    getMarktplaatsen,
    getMarktondernemersByMarkt,
    getPlaatsvoorkeuren,
    getToewijzingen,
} from './pakjekraam-api';
import { getAfwijzingen } from './model/afwijzing.functions';
import { retry } from './rxjs-util';
import { getAllUsers } from './keycloak-api';
import { checkLogin } from './makkelijkemarkt-api';
import { getMarktInfo } from './pakjekraam-api';
import { IMarktplaats, IPlaatsvoorkeur, IRSVP, IBranche, IMarktInfo } from 'markt.model';
import { MMMarkt } from 'makkelijkemarkt.model';


requireEnv('MAILER_FROM');

const marktDate = tomorrow();

const users$ = defer(() => getAllUsers()).pipe(
    tap(() => console.log('Keycloak OK!'), (e) => console.log(`Unable to connect to Keycloak: ${e}`)),
    retry(10, 5000),
    shareReplay(1),
);

const mailToewijzingen = (
    toewijzingen: any[],
    markt: MMMarkt,
    marktplaatsen: IMarktplaats[],
    plaatsvoorkeuren: IPlaatsvoorkeur[],
    aanmeldingen: IRSVP[],
    branches: IBranche[],
    marktInfoJSON: IMarktInfo,
    ) => {

    let first = true;

    toewijzingen
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
                telefoonnummer: marktInfoJSON.telefoonnummer
            };

            // console.log(
            //     `Stuur e-mail naar ${user.email}! Ondernemer is ingedeeld op plaats ${
            //     toewijzing.plaatsen
            //     }`,
            // );

            if (first) {

                const formattedMarkDate = yyyyMmDdtoDDMMYYYY(marktDate);
                const testEmail = {
                    from: process.env.MAILER_FROM,
                    // to: user.email,
                    to: 'tomootes@gmail.com',
                    subject: `Toewijzing ${formattedMarkDate} ${markt.naam}`,
                    react: <EmailIndeling {...props} />,
                };
                mail(testEmail).then(
                    () => {
                        console.log(`E-mail is verstuurd naar ${user.email}.`);
                        process.exit(0);
                    },
                    (err: Error) => {
                        console.error('E-mail sturen mislukt.', err);
                        process.exit(1);
                    },
                );

            }

            first = false;

        });
};

const mailAfwijzingen = (
    afwijzingen: any[],
    markt: MMMarkt,
    marktplaatsen: IMarktplaats[],
    plaatsvoorkeuren: IPlaatsvoorkeur[],
    aanmeldingen: IRSVP[],
    branches: IBranche[],
    marktInfoJSON: IMarktInfo,
    ) => {

    let first = true;

    afwijzingen
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
                telefoonnummer: marktInfoJSON.telefoonnummer
            };

            if (first) {

                const formattedMarkDate = yyyyMmDdtoDDMMYYYY(marktDate);
                const testEmail = {
                    from: process.env.MAILER_FROM,
                    // to: user.email,
                    to: 'tomootes@gmail.com',
                    subject: `Indeling ${process.env.NODE_ENV} ${formattedMarkDate} ${markt.naam}`,
                    react: <EmailIndeling {...props} />,
                };
                mail(testEmail).then(
                    () => {
                        console.log(`E-mail is verstuurd naar ${user.email}.`);
                        process.exit(0);
                    },
                    (err: Error) => {
                        console.error('E-mail sturen mislukt.', err);
                        process.exit(1);
                    },
                );

            }

            first = false;

        });

};

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
                    getAfwijzingen(String(markt.id), marktDate),
                    getPlaatsvoorkeuren(String(markt.id)),
                    getAanmeldingen(String(markt.id), marktDate),
                    getMarktplaatsen(String(markt.id)),
                    getAllBranches(),
                    getMarktInfo(String(markt.id)),
                ]).then(([
                    ondernemers,
                    toewijzingen,
                    afwijzingen,
                    plaatsvoorkeuren,
                    aanmeldingen,
                    marktplaatsen,
                    branches,
                    marktInfoJSON
                ]) => {

                    console.log(`Verstuur mails voor de marktindeling van ${markt.id} op datum ${marktDate}`);
                    console.log('Marktondernemers', ondernemers ? ondernemers.length : 0);
                    console.log('Toewijzingen', toewijzingen ? toewijzingen.length : 0);

                    const toewijzingenFiltered = toewijzingen
                        .map(toewijzing => {
                            const ondernemer = ondernemers.find(
                                ({ erkenningsNummer }) => erkenningsNummer.replace('.', '') === toewijzing.erkenningsNummer.replace('.', ''),
                            );
                            const user = users.find(
                                ({ username }) => username.replace('.', '') === toewijzing.erkenningsNummer.replace('.', '')
                            );
                            return {
                                toewijzing,
                                ondernemer,
                                user,
                            };
                        })
                        .filter(({ user }) => !!user && !!user.email);

                    const afwijzingenFiltered = afwijzingen
                        .map(afwijzing => {
                            const ondernemer = ondernemers.find(
                                ({ erkenningsNummer }) => erkenningsNummer.replace('.', '') === afwijzing.erkenningsNummer.replace('.', ''),
                            );
                            const user = users.find(
                                ({ username }) => username.replace('.', '') === afwijzing.erkenningsNummer.replace('.', '')
                            );
                            return {
                                afwijzing,
                                ondernemer,
                                user,
                            };
                        })
                        .filter(({ user }) => !!user && !!user.email);

                    mailToewijzingen(toewijzingenFiltered, markt, marktplaatsen, plaatsvoorkeuren, aanmeldingen, branches, marktInfoJSON);
                    mailAfwijzingen(afwijzingenFiltered, markt, marktplaatsen, plaatsvoorkeuren, aanmeldingen, branches, marktInfoJSON);


                    // const registeredUsers = users
                    //     .filter(({ username }) =>
                    //         ondernemers.some(({ erkenningsNummer }) => erkenningsNummer.replace('.', '') === username.replace('.', '')),

                    //     )
                    //     .filter(user => !!user.email);

                    // console.log(
                    //     'Geregistreerde marktondernemers met e-mail',
                    //     registeredUsers ? registeredUsers.length : 0,
                    // );

                }),
            ),
    ),
);


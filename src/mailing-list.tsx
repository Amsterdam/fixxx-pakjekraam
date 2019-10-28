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

            console.log(
                `Stuur e-mail naar ${user.email}! Ondernemer is ingedeeld op plaats ${
                toewijzing.plaatsen
                }`,
            );

            const formattedMarkDate = yyyyMmDdtoDDMMYYYY(marktDate);
            const testEmail = {
                from: process.env.MAILER_FROM,
                to: user.email,
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
            ).catch((e: any) => {
                console.log(e);
            });

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

            const formattedMarkDate = yyyyMmDdtoDDMMYYYY(marktDate);
            const testEmail = {
                from: process.env.MAILER_FROM,
                to: user.email,
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
                    console.log('Afwijzingen', afwijzingen ? afwijzingen.length : 0);

                    const toewijzingenFiltered = toewijzingen
                        .map(toewijzing => {
                            const ondernemer = ondernemers.find(
                                ({ erkenningsNummer }) => erkenningsNummer === toewijzing.erkenningsNummer,
                            );
                            const user = users.find(
                                ({ username }) => username === toewijzing.erkenningsNummer
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
                                ({ erkenningsNummer }) => erkenningsNummer === afwijzing.erkenningsNummer,
                            );
                            const user = users.find(
                                ({ username }) => username === afwijzing.erkenningsNummer
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

                }),
            ),
    ),
);


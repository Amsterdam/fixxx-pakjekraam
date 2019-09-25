import * as React from 'react';
import { EmailPage } from './views/EmailPage';
// import { defer } from 'rxjs';
// import { shareReplay, tap, combineLatest } from 'rxjs/operators';
import { mail } from './mail.js';
import { requireEnv } from './util';

requireEnv('MAILER_FROM');

const testEmail = {
    from: process.env.MAILER_FROM,
    to: 'tomootes@gmail.com',
    subject: 'Test email',
    react: <EmailPage />,
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
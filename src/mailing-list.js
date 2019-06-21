const React = require('react');
const EmailPage = require('./views/EmailPage.jsx');
const { mail } = require('./mail.js');

const testEmail = {
    from: process.env.MAILER_FROM,
    to: process.env.MAILER_FROM,
    subject: 'Marktindeling',
    react: <EmailPage />,
};

mail(testEmail).then(
    () => {
        console.log('E-mail is verstuurd.');
        process.exit(0);
    },
    err => {
        console.error('E-mail sturen mislukt.', err);
        process.exit(1);
    },
);

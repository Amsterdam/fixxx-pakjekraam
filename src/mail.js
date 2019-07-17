const ReactDOMServer = require('react-dom/server');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const { requireEnv } = require('./util.ts');

requireEnv('MAILER_URL');

const { username, password, hostname, port, searchParams } = new URL(process.env.MAILER_URL);

/*
 * Use SMTP as default transport.
 * When sending mail via SendGrid, use their optimized Web API.
 */
const transport = nodemailer.createTransport(
    hostname === 'smtp.sendgrid.net' && username === 'apikey'
        ? sgTransport({
              auth: {
                  api_key: password || searchParams.get('password'), // eslint-disable-line camelcase
              },
          })
        : {
              host: hostname,
              port,
              auth: {
                  user: username || searchParams.get('username'),
                  pass: password || searchParams.get('password'),
              },
          },
);

const mail = options => {
    if (options.react) {
        options = {
            ...options,
            html: ReactDOMServer.renderToStaticMarkup(options.react),
        };
    }

    return Promise.resolve(null);
    // return transport.sendMail(options);
};

module.exports = {
    mail,
};

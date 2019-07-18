import { Request, Response, NextFunction } from 'express';
import connectPgSimple = require('connect-pg-simple');
import express = require('express');
import Keycloak, { GrantedRequest, TokenContent } from 'keycloak-connect';
import * as reactViews from 'express-react-views';
import session from 'express-session';
import path from 'path';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import url from 'url';
import { readOnlyLogin } from './makkelijkemarkt-auth';
import { getMarkt, getMarktondernemer, getMarktondernemersByMarkt } from './makkelijkemarkt-api';
import { requireEnv } from './util';
import { HTTP_INTERNAL_SERVER_ERROR, internalServerErrorPage, getQueryErrors } from './express-util';
import { marktDetailController } from './routes/markt-detail';

import {
    getIndelingslijst,
    getIndelingslijstInput,
    getIndelingVoorkeur,
    getIndelingVoorkeuren,
    getAanmeldingen,
    getPlaatsvoorkeuren,
    getBranches,
    getMarkten,
    getSollicitantenlijstInput,
} from './pakjekraam-api';

import { serverHealth, databaseHealth, keycloakHealth, makkelijkeMarktHealth } from './routes/status';
import { activationPage, handleActivation } from './routes/activation';
import { registrationPage, handleRegistration } from './routes/registration';
import {
    attendancePage,
    handleAttendanceUpdate,
    marketApplicationPage,
    handleMarketApplication,
} from './routes/market-application';
import { marketPreferencesPage, updateMarketPreferences } from './routes/market-preferences';
import { vendorDashboardPage } from './routes/vendor-dashboard';
import { marketLocationPage, updateMarketLocation } from './routes/market-location';
import { preferencesMailPage } from './routes/mail-preferences';
import { applicationMailPage } from './routes/mail-application';
import { allocationMailPage } from './routes/mail-allocation';
import { activationQRPage } from './routes/activation-qr';
import { vasteplaatshoudersPage, sollicitantenPage, voorrangslijstPage } from './routes/market-vendors';
import { indelingslijstPage } from './routes/market-allocation';
import { KeycloakRoles } from './permissions';
const Pool = require('pg-pool');

const HTTP_DEFAULT_PORT = 8080;

const port = process.env.PORT || HTTP_DEFAULT_PORT;
const app = express();

const parseDatabaseURL = (str: string) => {
    const params = url.parse(str);
    const auth = params.auth.split(':');

    return {
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: parseInt(params.port, 10),
        database: params.pathname.split('/')[1],
    };
};

requireEnv('DATABASE_URL');
requireEnv('APP_SECRET');

const pgPool = new Pool(parseDatabaseURL(process.env.DATABASE_URL));

app.use(morgan(morgan.compile(':date[iso] :method :status :url :response-time ms')));

// The `/status/health` endpoint is required for Docker deployments
app.get('/status/health', serverHealth);

app.get('/status/database', databaseHealth);

app.get('/status/keycloak', keycloakHealth);

app.get('/status/makkelijkemarkt', makkelijkeMarktHealth);

// Required for Passport login form
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

const sessionStore = new (connectPgSimple(session))({
    pool: pgPool,
});

const keycloak = new Keycloak(
    { store: sessionStore },
    {
        realm: process.env.IAM_REALM,
        'auth-server-url': process.env.IAM_URL,
        'ssl-required': 'external',
        resource: process.env.IAM_CLIENT_ID,
        credentials: {
            secret: process.env.IAM_CLIENT_SECRET,
        },
        'confidential-port': 0,
    },
);

// Trick `keycloak-connect` into thinking we're running on HTTPS
app.set('trust proxy', true);

app.use(
    session({
        store: sessionStore,
        secret: process.env.APP_SECRET,
        resave: false,
        saveUninitialized: false,
    }),
);

app.use(
    keycloak.middleware({
        logout: '/logout',
    }),
);

const isMarktondernemer = (req: GrantedRequest) => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(KeycloakRoles.MARKTONDERNEMER)
    );
};

const isMarktmeester = (req: GrantedRequest) => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(KeycloakRoles.MARKTMEESTER)
    );
};

const getErkenningsNummer = (req: GrantedRequest) =>
    isMarktondernemer(req) && (req.kauth.grant.access_token.content as TokenContent & any).preferred_username;

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.expiry && Date.now() > Date.parse(req.session.expiry)) {
        console.log('Token is expired, logout user');
        res.redirect('/login');
    } else {
        next();
    }
});

// Initialize React JSX templates for server-side rendering
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
const templateEngine = reactViews.createEngine({ beautify: true });

app.engine('jsx', templateEngine);
app.engine('tsx', templateEngine);

app.get('/', (req: Request, res: Response) => {
    res.render('HomePage');
});

app.get(
    '/mail/:marktId/:marktDate/:erkenningsNummer/aanmeldingen',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    applicationMailPage,
);

app.get(
    '/mail/:marktId/:marktDate/:erkenningsNummer/voorkeuren',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    preferencesMailPage,
);

app.get('/email/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req: Request, res: Response) => {
    res.render('EmailPage');
});

app.get(
    '/mail/:marktId/:marktDate/:erkenningsNummer/indeling',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    allocationMailPage,
);

app.get('/markt/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req: Request, res: Response) => {
    getMarkten(req.session.token).then(markten => res.render('MarktenPage', { markten }));
});

app.get('/markt/:marktId/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req: Request, res: Response) => {
    getMarkt(req.session.token, req.params.marktId).then(markt => res.render('MarktDetailPage', { markt }));
});

app.get('/markt/:marktId/:datum/indelingslijst/', keycloak.protect(KeycloakRoles.MARKTMEESTER), indelingslijstPage);

app.get(
    '/markt/:marktId/:datum/vasteplaatshouders/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    vasteplaatshoudersPage,
);

app.get('/markt/:marktId/:datum/sollicitanten/', keycloak.protect(KeycloakRoles.MARKTMEESTER), sollicitantenPage);

app.get('/markt/:marktId/:datum/voorrangslijst/', keycloak.protect(KeycloakRoles.MARKTMEESTER), voorrangslijstPage);

app.get(
    '/markt-detail/:erkenningsNummer/:marktId/:datum/sollicitanten/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        const datum = req.params.datum;
        const type = 'sollicitanten';

        getSollicitantenlijstInput(req.session.token, req.params.marktId, req.params.datum).then(
            ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
                res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type });
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
            },
        );
    },
);

app.get('/dashboard/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req: GrantedRequest, res: Response) => {
    vendorDashboardPage(req, res, getErkenningsNummer(req));
});

app.get(
    '/ondernemer/:erkenningsNummer/dashboard/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        vendorDashboardPage(req, res, req.params.erkenningsNummer);
    },
);

app.get('/login', keycloak.protect(), (req: GrantedRequest, res: Response) => {
    readOnlyLogin().then(sessionData => {
        Object.assign(req.session, sessionData);

        if (isMarktondernemer(req)) {
            res.redirect('/dashboard/');
        } else if (isMarktmeester(req)) {
            res.redirect('/markt/');
        } else {
            res.redirect('/');
        }
    });
});

app.get(
    '/ondernemer/:erkenningsNummer/activatie-qr.svg',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    activationQRPage,
);

app.get('/activeren', activationPage);

app.post('/activeren', handleActivation);

app.get('/registreren', registrationPage);

app.post('/registreren', handleRegistration);

app.get('/welkom', (req: Request, res: Response) => {
    res.render('AccountCreatedPage', {});
});

app.get(
    '/makkelijkemarkt/api/1.1.0/markt/:marktId',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getMarkt(req.session.token, req.params.marktId).then(
            markt => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(markt));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/makkelijkemarkt/api/1.1.0/markt/',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getMarkten(req.session.token).then(
            markten => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(markten));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/makkelijkemarkt/api/1.1.0/marktondernemer/erkenningsnummer/:id',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getMarktondernemer(req.session.token, req.params.id).then(
            ondernemer => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(ondernemer));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/makkelijkemarkt/api/1.1.0/lijst/week/:marktId',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getMarktondernemersByMarkt(req.session.token, req.params.marktId).then(
            markten => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(markten));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/api/0.0.1/markt/:marktId/branches.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getBranches(req.params.marktId).then(
            branches => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(branches));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/api/0.0.1/markt/:marktId/:date/aanmeldingen.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getAanmeldingen(req.params.marktId, req.params.date).then(
            branches => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(branches));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/api/0.0.1/markt/:marktId/voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getPlaatsvoorkeuren(req.params.marktId).then(
            branches => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(branches));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get('/afmelden/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req: GrantedRequest, res: Response) => {
    attendancePage(res, req.session.token, getErkenningsNummer(req), null, req.query, KeycloakRoles.MARKTONDERNEMER);
});

app.get(
    '/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response) => {
        attendancePage(
            res,
            req.session.token,
            getErkenningsNummer(req),
            req.params.marktId,
            req.query,
            KeycloakRoles.MARKTONDERNEMER,
        );
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/afmelden/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        attendancePage(
            res,
            req.session.token,
            req.params.erkenningsNummer,
            null,
            req.query,
            KeycloakRoles.MARKTMEESTER,
        );
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        attendancePage(
            res,
            req.session.token,
            req.params.erkenningsNummer,
            req.params.marktId,
            req.query,
            KeycloakRoles.MARKTMEESTER,
        );
    },
);

app.post(
    ['/afmelden/', '/afmelden/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        handleAttendanceUpdate(req, res, next, getErkenningsNummer(req)),
);

app.post(
    ['/ondernemer/:erkenningsNummer/afmelden/', '/ondernemer/:erkenningsNummer/afmelden/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response, next: NextFunction) =>
        handleAttendanceUpdate(req, res, next, req.params.erkenningsNummer),
);

app.get(
    '/aanmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response) => {
        marketApplicationPage(res, req.session.token, getErkenningsNummer(req), req.params.marktId, req.query);
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/aanmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        marketApplicationPage(res, req.session.token, req.params.erkenningsNummer, req.params.marktId, req.query);
    },
);

app.post(
    ['/aanmelden/', '/aanmelden/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        handleMarketApplication(req, res, next, getErkenningsNummer(req));
    },
);

app.post(
    ['/ondernemer/:erkenningsNummer/aanmelden/', '/ondernemer/:erkenningsNummer/aanmelden/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response, next: NextFunction) => {
        handleMarketApplication(req, res, next, req.params.erkenningsNummer);
    },
);

app.get(
    '/voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response) => {
        marketLocationPage(
            req,
            res,
            req.session.token,
            getErkenningsNummer(req),
            req.query,
            req.params.marktId,
            KeycloakRoles.MARKTONDERNEMER,
        );
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        marketLocationPage(
            req,
            res,
            req.session.token,
            req.params.erkenningsNummer,
            req.query,
            req.params.marktId,
            KeycloakRoles.MARKTMEESTER,
        );
    },
);

const jsonPage = (res: Response) => (data: any) => {
    res.set({
        'Content-Type': 'application/json; charset=UTF-8',
    });
    res.send(JSON.stringify(data, null, '  '));
};

app.get(
    '/algemene-voorkeuren/:erkenningsNummer/voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: Request, res: Response) => {
        getIndelingVoorkeur(req.params.erkenningsNummer).then(jsonPage(res), internalServerErrorPage(res));
    },
);

app.get(
    '/algemene-voorkeuren/:marktId/markt-voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: Request, res: Response) => {
        getIndelingVoorkeuren(req.params.marktId).then(jsonPage(res), internalServerErrorPage(res));
    },
);

app.get(
    '/algemene-voorkeuren/:marktId/:marktDate/markt-voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: Request, res: Response) => {
        getIndelingVoorkeuren(req.params.marktId, req.params.marktDate).then(
            jsonPage(res),
            internalServerErrorPage(res),
        );
    },
);

app.get(
    '/markt-detail/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        marktDetailController(req, res, next, getErkenningsNummer(req)),
);

app.get(
    '/ondernemer/:erkenningsNummer/markt-detail/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response, next: NextFunction) =>
        marktDetailController(req, res, next, req.params.erkenningsNummer),
);

app.post(
    ['/algemene-voorkeuren/', '/algemene-voorkeuren/:marktId/', '/algemene-voorkeuren/:marktId/:marktDate/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updateMarketPreferences(req, res, next, getErkenningsNummer(req)),
);

app.post(
    [
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/',
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/:marktDate/',
    ],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response, next: NextFunction) =>
        updateMarketPreferences(req, res, next, req.params.erkenningsNummer),
);

app.get(
    '/algemene-voorkeuren/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.session.token,
            getErkenningsNummer(req),
            null,
            null,
            KeycloakRoles.MARKTONDERNEMER,
        );
    },
);

app.get(
    '/algemene-voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.session.token,
            getErkenningsNummer(req),
            req.params.marktId,
            null,
            KeycloakRoles.MARKTONDERNEMER,
        );
    },
);

app.get(
    '/algemene-voorkeuren/:marktId/:marktDate/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.session.token,
            getErkenningsNummer(req),
            req.params.marktId,
            req.params.marktDate,
            KeycloakRoles.MARKTONDERNEMER,
        );
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.session.token,
            req.params.erkenningsNummer,
            null,
            null,
            KeycloakRoles.MARKTMEESTER,
        );
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.session.token,
            req.params.erkenningsNummer,
            req.params.marktId,
            null,
            KeycloakRoles.MARKTMEESTER,
        );
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/:marktDate/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.session.token,
            req.params.erkenningsNummer,
            req.params.marktId,
            req.params.marktDate,
            KeycloakRoles.MARKTMEESTER,
        );
    },
);

app.post(
    ['/voorkeuren/', '/voorkeuren/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updateMarketLocation(req, res, next, getErkenningsNummer(req)),
);

app.post(
    ['/ondernemer/:erkenningsNummer/voorkeuren/', '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response, next: NextFunction) =>
        updateMarketLocation(req, res, next, req.params.erkenningsNummer),
);

app.get('/profile/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req: GrantedRequest, res: Response) => {
    const messages = getQueryErrors(req.query);

    getMarktondernemer(req.session.token, getErkenningsNummer(req)).then(ondernemer => {
        res.render('ProfilePage', {
            user: {
                userType: 'marktondernemer',
            },
            ondernemer,
            messages,
        });
    });
});

app.get('/profile/:erkenningsNummer', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req: Request, res: Response) => {
    const messages = getQueryErrors(req.query);

    getMarktondernemer(req.session.token, req.params.erkenningsNummer).then(
        ondernemer => {
            res.render('PublicProfilePage', { ondernemer, messages });
        },
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
});

app.get(
    '/markt/:marktId/:marktDate/markt.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getIndelingslijstInput(req.session.token, req.params.marktId, req.params.marktDate).then(
            data => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(data, null, '  '));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
            },
        );
    },
);

app.get(
    '/markt/:marktId/:marktDate/markt-indeling.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getIndelingslijst(req.session.token, req.params.marktId, req.params.marktDate).then(
            markt => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(markt || [], null, '  '));
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
            },
        );
    },
);

app.get(
    '/markt-indeling/:marktId/:datum/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        res.render('MarktIndelingPage', {});
    },
);

// Static files that are public (robots.txt, favicon.ico)
app.use(express.static('./src/public/'));
app.use(express.static('./dist/public/'));

// Static files that require authorization (business logic scripts for example)
app.use(keycloak.protect(), express.static('./src/www/'));

app.listen(port, (err: Error | null) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Listening on port ${port}`);
    }
});

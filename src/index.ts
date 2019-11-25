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
import { getMarkt, getMarktondernemer, getMarktondernemersByMarkt } from './makkelijkemarkt-api';
import { requireEnv, today, tomorrow } from './util';
import { HTTP_INTERNAL_SERVER_ERROR, internalServerErrorPage, jsonPage, getQueryErrors } from './express-util';
import { marktDetailController } from './routes/markt-detail';
import { getMarktEnriched, getMarktenEnabled } from './model/markt.functions';
import cookieParser from 'cookie-parser';

import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

import {
    getIndelingslijst,
    getIndelingslijstInput,
    getIndelingVoorkeur,
    getIndelingVoorkeuren,
    getAanmeldingen,
    getPlaatsvoorkeuren,
    getBranches,
    getMarkten,
    getMarktenByDate,
    getSollicitantenlijstInput,
} from './pakjekraam-api';

import { serverHealth, serverTime, databaseHealth, keycloakHealth, makkelijkeMarktHealth } from './routes/status';
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
import { deleteUserPage, deleteUser, publicProfilePage } from './routes/ondernemer';
import { vasteplaatshoudersPage, sollicitantenPage, voorrangslijstPage, voorrangslijstVolledigPage, afmeldingenVasteplaatshoudersPage } from './routes/market-vendors';
import { indelingslijstPage, marketAllocationPage, indelingPage } from './routes/market-allocation';
import { KeycloakRoles } from './permissions';
const Pool = require('pg-pool');

requireEnv('DATABASE_URL');
requireEnv('APP_SECRET');

const HTTP_DEFAULT_PORT = 8080;

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

const getErkenningsNummer = (req: GrantedRequest) => {
    const tokenContent = req.kauth.grant.access_token.content as TokenContent & any;
    return isMarktondernemer(req) && tokenContent.preferred_username.replace(/\./g, '');
};

const app = express();

// Trick `keycloak-connect` into thinking we're running on HTTPS
app.set('trust proxy', true);
// Initialize React JSX templates for server-side rendering
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
const templateEngine = reactViews.createEngine({ beautify: true });

app.engine('jsx', templateEngine);
app.engine('tsx', templateEngine);

app.use(morgan(morgan.compile(':date[iso] :method :status :url :response-time ms')));

// The `/status/health` endpoint is required for Docker deployments
app.get('/status/health', serverHealth);
app.get('/status/time', serverTime);
app.get('/status/database', databaseHealth);
app.get('/status/keycloak', keycloakHealth);
app.get('/status/makkelijkemarkt', makkelijkeMarktHealth);

// Required for Passport login form
app.use(bodyParser.urlencoded({ extended: true }));
// We need to parse cookies because csurf needs them
app.use(cookieParser());
// app.use(bodyParser.json());

const pool = new Pool(parseDatabaseURL(process.env.DATABASE_URL));
const sessionStore = new (connectPgSimple(session))({ pool });

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

app.use(
    session({
        store: sessionStore,
        secret: process.env.APP_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true
        }
    }),
);

app.use(
    keycloak.middleware({
        logout: '/logout',
    }),
);

// Put the login route before the expired redirect to prevent an
// endless loop.
app.get('/login', keycloak.protect(), (req: GrantedRequest, res: Response) => {
    if (req.query.next) {
        res.redirect(req.query.next);
    } else if (isMarktondernemer(req)) {
        res.redirect('/dashboard/');
    } else if (isMarktmeester(req)) {
        res.redirect('/markt/');
    } else {
        res.redirect('/');
    }
});

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

app.get(
    '/markt/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        return getMarktenEnabled()
            .then((markten: any) => {
                res.render('MarktenPage', { markten });
            }, internalServerErrorPage(res));
});

app.get(
    '/environment/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response) => {
        res.render('EnvironmentPage');
    }
);

// For debug purposes:
app.get('/markt/index.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req: Request, res: Response) => {
    getMarkten().then(jsonPage(res));
});

// For debug purposes:
app.get('/markt/today.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req: Request, res: Response) => {
    getMarktenByDate(today()).then(jsonPage(res));
});

// For debug purposes:
app.get('/markt/tomorrow.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req: Request, res: Response) => {
    getMarktenByDate(tomorrow()).then(jsonPage(res));
});

app.get(
    '/markt/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req: Request, res: Response, next: NextFunction) => {
        getMarktEnriched(req.params.marktId)
            .then((markt: any) => res.render('MarktDetailPage', { markt }))
            .catch(next);
    },
);

app.get(
    '/markt/:marktId/:marktDate/concept-indelingslijst/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    indelingslijstPage,
);

app.get(
    '/markt/:marktId/:marktDate/indelingslijst/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    marketAllocationPage,
);

app.get(
    '/markt/:marktId/:marktDate/indeling/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    indelingPage,
);

app.get(
    '/markt/:marktId/:datum/vasteplaatshouders/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    vasteplaatshoudersPage,
);

app.get('/markt/:marktId/:datum/sollicitanten/', keycloak.protect(KeycloakRoles.MARKTMEESTER), sollicitantenPage);

app.get('/markt/:marktId/:datum/voorrangslijst/', keycloak.protect(KeycloakRoles.MARKTMEESTER), voorrangslijstPage);

app.get('/markt/:marktId/:datum/voorrangslijst-volledig/', keycloak.protect(KeycloakRoles.MARKTMEESTER), voorrangslijstVolledigPage);

app.get(
    '/markt/:marktId/:datum/afmeldingen-vasteplaatshouders/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    afmeldingenVasteplaatshoudersPage
);

// app.get(
//     '/markt-detail/:erkenningsNummer/:marktId/:datum/sollicitanten/',
//     keycloak.protect(KeycloakRoles.MARKTMEESTER),
//     (req: Request, res: Response) => {
//         const datum = req.params.datum;
//         const type = 'sollicitanten';

//         getSollicitantenlijstInput(req.params.marktId, req.params.datum).then(
//             ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
//                 res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type });
//             },
//             err => {
//                 res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
//             },
//         );
//     },
// );

app.get(
    '/dashboard/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        vendorDashboardPage(req, res, next, getErkenningsNummer(req));
    },
);

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
        getMarkt(req.params.marktId).then(
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
        getMarkten().then(
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
        getMarktondernemer(req.params.id).then(
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
        getMarktondernemersByMarkt(req.params.marktId).then(
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

app.get(
    '/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        attendancePage(
            res,
            getErkenningsNummer(req),
            req.params.marktId,
            req.query,
            KeycloakRoles.MARKTONDERNEMER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        handleAttendanceUpdate(req, res, next, getErkenningsNummer(req)),
);

app.get(
    '/ondernemer/:erkenningsNummer/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response) => {
        attendancePage(
            res,
            req.params.erkenningsNummer,
            req.params.marktId,
            req.query,
            KeycloakRoles.MARKTMEESTER,
            req.csrfToken()
        );
    },
);

app.post(
    '/ondernemer/:erkenningsNummer/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response, next: NextFunction) =>
        handleAttendanceUpdate(req, res, next, req.params.erkenningsNummer),
);

app.get(
    '/voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        marketLocationPage(
            req,
            res,
            getErkenningsNummer(req),
            req.query,
            req.params.marktId,
            KeycloakRoles.MARKTONDERNEMER,
            req.csrfToken(),
        );
    },
);

app.post(
    ['/voorkeuren/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updateMarketLocation(req, res, next, getErkenningsNummer(req)),
);

app.get(
    '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response) => {
        marketLocationPage(
            req,
            res,
            req.params.erkenningsNummer,
            req.query,
            req.params.marktId,
            KeycloakRoles.MARKTMEESTER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response, next: NextFunction) =>
        updateMarketLocation(req, res, next, req.params.erkenningsNummer),
);


app.get(
    '/algemene-voorkeuren/:marktId/markt-voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req: Request, res: Response) => {
        getIndelingVoorkeuren(req.params.marktId)
            .then(jsonPage(res), internalServerErrorPage(res));
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

app.get(
    '/algemene-voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            getErkenningsNummer(req),
            req.params.marktId,
            null,
            KeycloakRoles.MARKTONDERNEMER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/algemene-voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updateMarketPreferences(req, res, next, getErkenningsNummer(req), KeycloakRoles.MARKTONDERNEMER),
);

app.get(
    '/verwijder-ondernemer/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response) => {
        deleteUserPage(req, res, null, null, req.csrfToken());
    },
);

app.post(
    '/verwijder-ondernemer/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response) => {
        deleteUser(req, res, req.body.erkenningsNummer);
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.params.erkenningsNummer,
            req.params.marktId,
            null,
            KeycloakRoles.MARKTMEESTER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    csrfProtection,
    (req: Request, res: Response, next: NextFunction) =>
        updateMarketPreferences(req, res, next, req.params.erkenningsNummer, KeycloakRoles.MARKTMEESTER),
);

app.get('/profile/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req: GrantedRequest, res: Response) => {
    const messages = getQueryErrors(req.query);

    getMarktondernemer(getErkenningsNummer(req)).then(ondernemer => {
        res.render('ProfilePage', {
            user: {
                userType: 'marktondernemer',
            },
            ondernemer,
            messages,
        });
    });
});

app.get('/profile/:erkenningsNummer', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req: Request, res: Response) =>
    publicProfilePage(req, res, req.params.erkenningsNummer)
);

app.get(
    '/markt/:marktId/:marktDate/markt.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getIndelingslijstInput(req.params.marktId, req.params.marktDate).then(
            (data: any) => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(data, null, '  '));
            },
            (err: Error) => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
            },
        );
    },
);

app.get(
    '/markt/:marktId/:marktDate/markt-indeling.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req: Request, res: Response) => {
        getIndelingslijst(req.params.marktId, req.params.marktDate).then(
            (markt: any) => {
                res.set({
                    'Content-Type': 'application/json; charset=UTF-8',
                });
                res.send(JSON.stringify(markt || [], null, '  '));
            },
            (err: Error) => {
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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (process.env.APP_ENV === 'production') {
        res.render('ErrorPage', { errorCode: 500, req });
    } else {
        res.render('ErrorPage', { message: err.message, stack: err.stack, errorCode: 500, req });
    }
});

// Static files that are public (robots.txt, favicon.ico)
app.use(express.static('./src/public/'));
app.use(express.static('./dist/public/'));

// Static files that require authorization (business logic scripts for example)
app.use(keycloak.protect(), express.static('./src/www/'));

const port = process.env.PORT || HTTP_DEFAULT_PORT;

app.listen(port, (err: Error | null) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Listening on port ${port}`);
    }
});

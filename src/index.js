const ReactDOMServer = require('react-dom/server');
const PgPool = require('pg-pool');
const React = require('react');
const connectPg = require('connect-pg-simple');
const express = require('express');
const Keycloak = require('keycloak-connect');
const reactViews = require('express-react-views');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const models = require('./model/index.ts');
const { sequelize } = require('./model/index.ts');
const morgan = require('morgan');
const url = require('url');
const qs = require('qs');
const { isErkenningsnummer, slugifyMarkt, isVast, filterRsvpList } = require('./domain-knowledge.js');
const { checkActivationCode, readOnlyLogin } = require('./makkelijkemarkt-auth.ts');
const { login, getMarkt, getMarktondernemer, getMarktondernemersByMarkt } = require('./makkelijkemarkt-api.ts');
const {
    formatDate,
    tomorrow,
    nextWeek,
    addDays,
    endOfWeek,
    requireEnv,
    requireOne,
    toISODate,
    trace,
    traceError,
} = require('./util.ts');
const { upsert } = require('./sequelize-util.js');
const { getKeycloakAdmin, userExists } = require('./keycloak-api.ts');
const { mail } = require('./mail.js');
const { EmailIndeling } = require('./views/EmailIndeling.tsx');
const EmailWijzigingAanmeldingen = require('./views/EmailWijzigingAanmeldingen.jsx');
const EmailWijzigingVoorkeuren = require('./views/EmailWijzigingVoorkeuren.jsx');
const {
    errorPage,
    HTTP_CREATED_SUCCESS,
    HTTP_BAD_REQUEST,
    HTTP_FORBIDDEN_ERROR,
    HTTP_PAGE_NOT_FOUND,
    HTTP_INTERNAL_SERVER_ERROR,
    httpErrorPage,
    internalServerErrorPage,
    forbiddenErrorPage,
    publicErrors,
    getQueryErrors,
} = require('./express-util.ts');
const { marktDetailController } = require('./routes/markt-detail.ts');

const {
    getMailContext,
    getAllBranches,
    getMarktProperties,
    getMarktPaginas,
    getIndelingslijst,
    getIndelingslijstInput,
    getIndelingVoorkeur,
    getIndelingVoorkeuren,
    getVoorkeurenMarktOndern,
    getAanmeldingenMarktOndern,
    getAanmeldingen,
    getAanmeldingenByOndernemer,
    getOndernemerVoorkeuren,
    getPlaatsvoorkeuren,
    getBranches,
    getMarktplaatsen,
    getMarkten,
    getSollicitantenlijstInput,
    getVoorrangslijstInput,
} = require('./pakjekraam-api.ts');

const { serverHealth, databaseHealth, keycloakHealth, makkelijkeMarktHealth } = require('./routes/status.ts');
const { activationPage, handleActivation } = require('./routes/activation.ts');
const { registrationPage, handleRegistration } = require('./routes/registration.ts');
const {
    attendancePage,
    handleAttendanceUpdate,
    marketApplicationPage,
    handleMarketApplication,
} = require('./routes/market-application.ts');
const { marketPreferencesPage, updateMarketPreferences } = require('./routes/market-preferences.ts');
const { vendorDashboardPage } = require('./routes/vendor-dashboard.ts');
const { marketLocationPage, updateMarketLocation } = require('./routes/market-location.ts');
const { preferencesMailPage } = require('./routes/mail-preferences.tsx');
const { applicationMailPage } = require('./routes/mail-application.tsx');
const { allocationMailPage } = require('./routes/mail-allocation.tsx');
const { activationQRPage } = require('./routes/activation-qr.ts');
const { KeycloakRoles } = require('./permissions');

const HTTP_DEFAULT_PORT = 8080;

const port = process.env.PORT || HTTP_DEFAULT_PORT;
const app = express();

const parseDatabaseURL = str => {
    const params = url.parse(str);
    const auth = params.auth.split(':');

    return {
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        database: params.pathname.split('/')[1],
    };
};

requireEnv('DATABASE_URL');
requireEnv('APP_SECRET');

const pgPool = new PgPool(parseDatabaseURL(process.env.DATABASE_URL));

app.use(morgan(morgan.compile(':date[iso] :method :status :url :response-time ms')));

// The `/status/health` endpoint is required for Docker deployments
app.get('/status/health', serverHealth);

app.get('/status/database', databaseHealth);

app.get('/status/keycloak', keycloakHealth);

app.get('/status/makkelijkemarkt', makkelijkeMarktHealth);

// Required for Passport login form
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

const sessionStore = new (connectPg(session))({
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

const isMarktondernemer = req => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(KeycloakRoles.MARKTONDERNEMER)
    );
};

const isMarktmeester = req => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(KeycloakRoles.MARKTMEESTER)
    );
};

const getErkenningsNummer = req => isMarktondernemer(req) && req.kauth.grant.access_token.content.preferred_username;

app.use((req, res, next) => {
    if (req.user && req.session.expiry && Date.now() > Date.parse(req.session.expiry)) {
        console.log('Token is expired, logout user');
        res.redirect('/login');
    } else {
        next();
    }
});

// Initialize React JSX templates for server-side rendering
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', reactViews.createEngine({ beautify: true }));

app.get('/', (req, res) => {
    res.render('HomePage', { user: req.user });
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

app.get('/email/', keycloak.protect(KeycloakRoles.MARKTMEESTER), function(req, res) {
    res.render('EmailPage');
});

app.get(
    '/mail/:marktId/:marktDate/:erkenningsNummer/indeling',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    allocationMailPage,
);

app.get('/markt/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const user = req.session.token;
    getMarkten(req.session.token).then(markten => res.render('MarktenPage', { markten, user }));
});

app.get('/markt/:marktId/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const user = req.session.token;
    getMarkt(req.session.token, req.params.marktId).then(markt => res.render('MarktDetailPage', { markt, user }));
});

app.get('/markt/:marktId/:datum/indelingslijst/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'indelingslijst';
    getIndelingslijst(req.session.token, req.params.marktId, datum).then(
        data => {
            res.render('IndelingslijstPage', { data, datum, type, user });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/markt/:marktId/:datum/vasteplaatshouders/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getIndelingslijstInput(req.session.token, req.params.marktId, datum).then(
        data => {
            res.render('VastplaatshoudersPage', { data, datum, type, user });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/markt/:marktId/:datum/sollicitanten/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'sollicitanten';
    getSollicitantenlijstInput(req.session.token, req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, user });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/markt/:marktId/:datum/voorrangslijst/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const user = req.session.token;
    const datum = req.params.datum;
    const type = 'voorrangslijst';
    getVoorrangslijstInput(req.session.token, req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt, toewijzingen }) => {
            res.render('VoorrangslijstPage', {
                ondernemers,
                aanmeldingen,
                voorkeuren,
                markt,
                datum,
                type,
                user,
                toewijzingen,
            });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get(
    '/markt-detail/:erkenningsNummer/:marktId/:datum/sollicitanten/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res) => {
        const user = req.session.token;
        const datum = req.params.datum;
        const type = 'sollicitanten';
        getSollicitantenlijstInput(req.session.token, req.params.marktId, req.params.datum).then(
            ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
                res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, user });
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
            },
        );
    },
);

app.get('/dashboard/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    vendorDashboardPage(req, res, getErkenningsNummer(req));
});

app.get('/ondernemer/:erkenningsNummer/dashboard/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    vendorDashboardPage(req, res, req.params.erkenningsNummer);
});

app.get('/login', keycloak.protect(), (req, res) => {
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

app.get('/welkom', (req, res) => {
    res.render('AccountCreatedPage', {});
});

app.get('/makkelijkemarkt/api/1.1.0/markt/:marktId', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get('/makkelijkemarkt/api/1.1.0/markt/', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get(
    '/makkelijkemarkt/api/1.1.0/marktondernemer/erkenningsnummer/:id',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req, res) => {
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

app.get('/makkelijkemarkt/api/1.1.0/lijst/week/:marktId', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get('/api/0.0.1/markt/:marktId/branches.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get(
    '/api/0.0.1/markt/:marktId/:date/aanmeldingen.json',
    keycloak.protect(KeycloakRoles.MARKTBUREAU),
    (req, res) => {
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

app.get('/api/0.0.1/markt/:marktId/voorkeuren.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get('/afmelden/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    attendancePage(res, req.session.token, getErkenningsNummer(req), null, req.query, KeycloakRoles.MARKTONDERNEMER);
});

app.get('/afmelden/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    attendancePage(
        res,
        req.session.token,
        getErkenningsNummer(req),
        req.params.marktId,
        req.query,
        KeycloakRoles.MARKTONDERNEMER,
    );
});

app.get('/ondernemer/:erkenningsNummer/afmelden/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    attendancePage(res, req.session.token, req.params.erkenningsNummer, null, req.query, KeycloakRoles.MARKTMEESTER);
});

app.get(
    '/ondernemer/:erkenningsNummer/afmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res) => {
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

app.post(['/afmelden/', '/afmelden/:marktId/'], keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res, next) =>
    handleAttendanceUpdate(req, res, next, getErkenningsNummer(req)),
);

app.post(
    ['/ondernemer/:erkenningsNummer/afmelden/', '/ondernemer/:erkenningsNummer/afmelden/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => handleAttendanceUpdate(req, res, next, req.params.erkenningsNummer),
);

app.get('/aanmelden/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    marketApplicationPage(res, req.session.token, getErkenningsNummer(req));
});

app.get('/aanmelden/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    marketApplicationPage(res, req.session.token, getErkenningsNummer(req), req.params.marktId, req.query);
});

app.get('/ondernemer/:erkenningsNummer/aanmelden/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    marketApplicationPage(res, req.session.token, req.params.erkenningsNummer);
});

app.get(
    '/ondernemer/:erkenningsNummer/aanmelden/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res) => {
        marketApplicationPage(res, req.session.token, req.params.erkenningsNummer, req.params.marktId, req.query);
    },
);

app.post(['/aanmelden/', '/aanmelden/:marktId/'], keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    handleMarketApplication(req, res, next, getErkenningsNummer(req));
});

app.post(
    ['/ondernemer/:erkenningsNummer/aanmelden/', '/ondernemer/:erkenningsNummer/aanmelden/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res) => {
        handleMarketApplication(req, res, next, req.params.erkenningsNummer);
    },
);

app.get('/voorkeuren/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    marketLocationPage(
        req,
        res,
        req.session.token,
        getErkenningsNummer(req),
        req.query,
        req.params.marktId,
        KeycloakRoles.MARKTONDERNEMER,
    );
});

app.get(
    '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res) => {
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

const jsonPage = res => data => {
    res.set({
        'Content-Type': 'application/json; charset=UTF-8',
    });
    res.send(JSON.stringify(data, null, '  '));
};

app.get(
    '/algemene-voorkeuren/:erkenningsNummer/voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res) => {
        getIndelingVoorkeur(req.params.erkenningsNummer).then(jsonPage(res), internalServerErrorPage(res));
    },
);

app.get(
    '/algemene-voorkeuren/:marktId/markt-voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res) => {
        getIndelingVoorkeuren(req.params.marktId).then(jsonPage(res), internalServerErrorPage(res));
    },
);

app.get(
    '/algemene-voorkeuren/:marktId/:marktDate/markt-voorkeuren.json',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res) => {
        getIndelingVoorkeuren(req.params.marktId, req.params.marktDate).then(
            jsonPage(res),
            internalServerErrorPage(res),
        );
    },
);

app.get('/markt-detail/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res, next) =>
    marktDetailController(req, res, next, getErkenningsNummer(req)),
);

app.get(
    '/ondernemer/:erkenningsNummer/markt-detail/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => marktDetailController(req, res, next, req.params.erkenningsNummer),
);

app.post(
    ['/algemene-voorkeuren/', '/algemene-voorkeuren/:marktId/', '/algemene-voorkeuren/:marktId/:marktDate/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res, next) => updateMarketPreferences(req, res, next, getErkenningsNummer(req)),
);

app.post(
    [
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/',
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/:marktDate/',
    ],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => updateMarketPreferences(req, res, next, req.params.erkenningsNummer),
);

app.get('/algemene-voorkeuren/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    marketPreferencesPage(
        req,
        res,
        req.session.token,
        getErkenningsNummer(req),
        null,
        null,
        KeycloakRoles.MARKTONDERNEMER,
    );
});

app.get('/algemene-voorkeuren/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    marketPreferencesPage(
        req,
        res,
        req.session.token,
        getErkenningsNummer(req),
        req.params.marktId,
        null,
        KeycloakRoles.MARKTONDERNEMER,
    );
});

app.get('/algemene-voorkeuren/:marktId/:marktDate/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    marketPreferencesPage(
        req,
        res,
        req.session.token,
        getErkenningsNummer(req),
        req.params.marktId,
        req.params.marktDate,
        KeycloakRoles.MARKTONDERNEMER,
    );
});

app.get(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res) => {
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
    (req, res) => {
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
    (req, res) => {
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

app.post(['/voorkeuren/', '/voorkeuren/:marktId/'], keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res, next) =>
    updateMarketLocation(req, res, next, getErkenningsNummer(req)),
);

app.post(
    ['/ondernemer/:erkenningsNummer/voorkeuren/', '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => updateMarketLocation(req, res, next, req.params.erkenningsNummer),
);

app.get('/profile/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
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

app.get('/profile/:erkenningsNummer', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    const messages = getQueryErrors(req.query);
    getMarktondernemer(req.session.token, req.params.erkenningsNummer).then(
        ondernemer => {
            res.render('PublicProfilePage', { ondernemer, user: req.user, messages });
        },
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
});

app.get('/markt/:marktId/:marktDate/markt.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get('/markt/:marktId/:marktDate/markt-indeling.json', keycloak.protect(KeycloakRoles.MARKTBUREAU), (req, res) => {
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
});

app.get('/markt-indeling/:marktId/:datum/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    res.render('MarktIndelingPage', {});
});

// Static files that are public (robots.txt, favicon.ico)
app.use(express.static('./src/public/'));
app.use(express.static('./dist/public/'));

// Static files that require authorization (business logic scripts for example)
app.use(keycloak.protect(), express.static('./src/www/'));

app.listen(port, err => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Listening on port ${port}`);
    }
});

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
    splitByValueArray,
    tomorrow,
    nextWeek,
    addDays,
    endOfWeek,
    requireEnv,
    requireOne,
    toISODate,
    trace,
    traceError,
} = require('./util.js');
const { upsert } = require('./sequelize-util.js');
const { getKeycloakAdmin, userExists } = require('./keycloak-api.ts');
const { mail } = require('./mail.js');
const EmailIndeling = require('./views/EmailIndeling.jsx');
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
    function(req, res) {
        const ondernemerPromise = getMarktondernemer(req.session.token, req.params.erkenningsNummer);
        const marktPromise = getMarkt(req.session.token, req.params.marktId);
        const aanmeldingenPromise = getAanmeldingenMarktOndern(req.params.marktId, req.params.erkenningsNummer);
        Promise.all([ondernemerPromise, marktPromise, aanmeldingenPromise]).then(
            ([ondernemer, markt, aanmeldingen]) => {
                const marktDate = new Date(req.params.marktDate);
                const aanmeldingenFiltered = filterRsvpList(aanmeldingen, markt, marktDate);
                const subject =
                    `Markt ${markt.naam} - ` + isVast(ondernemer.status)
                        ? 'aanwezigheid wijziging'
                        : 'aanmelding wijziging';
                const props = { markt, marktDate, ondernemer, aanmeldingen: aanmeldingenFiltered };
                res.render('EmailWijzigingAanmeldingen', props);

                if (req.query.mailto) {
                    const to = req.query.mailto;
                    mail({
                        from: to,
                        to,
                        subject,
                        react: <EmailWijzigingAanmeldingen {...props} />,
                    }).then(
                        () => {
                            console.log(`E-mail is verstuurd naar ${to}`);
                        },
                        err => {
                            console.error(`E-mail sturen naar ${to} is mislukt`, err);
                        },
                    );
                }
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get(
    '/mail/:marktId/:marktDate/:erkenningsNummer/voorkeuren',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    function(req, res) {
        const mailContextPromise = getMailContext(
            req.session.token,
            req.params.marktId,
            req.params.erkenningsNummer,
            req.params.marktDate,
        );
        const ondernemerPromise = getMarktondernemer(req.session.token, req.params.erkenningsNummer);
        const marktPromise = getMarkt(req.session.token, req.params.marktId);
        const voorkeurenPromise = getVoorkeurenMarktOndern(req.params.marktId, req.params.erkenningsNummer);
        Promise.all([ondernemerPromise, marktPromise, voorkeurenPromise]).then(
            ([ondernemer, markt, voorkeuren]) => {
                const marktDate = new Date(req.params.marktDate);
                const subject = `Markt ${markt.naam} - plaatsvoorkeur wijziging`;

                const voorkeurenObjPrio = (voorkeuren || []).reduce(function(hash, voorkeur) {
                    if (!hash.hasOwnProperty(voorkeur.priority)) hash[voorkeur.priority] = [];
                    hash[voorkeur.priority].push(voorkeur);

                    return hash;
                }, {});
                const voorkeurenPrio = Object.keys(voorkeurenObjPrio)
                    .map(function(key) {
                        return voorkeurenObjPrio[key];
                    })
                    .sort((a, b) => b[0].priority - a[0].priority)
                    .map(voorkeurList => voorkeurList.map(voorkeur => voorkeur.plaatsId));

                const props = { ondernemer, markt, voorkeuren: voorkeurenPrio, marktDate };

                res.render('EmailWijzigingVoorkeuren', props);

                if (req.query.mailto) {
                    const to = req.query.mailto;
                    mail({
                        from: to,
                        to,
                        subject,
                        react: <EmailWijzigingVoorkeuren {...props} />,
                    }).then(
                        () => {
                            console.log(`E-mail is verstuurd naar ${to}`);
                        },
                        err => {
                            console.error(`E-mail sturen naar ${to} is mislukt`, err);
                        },
                    );
                }
            },
            err => {
                res.status(HTTP_INTERNAL_SERVER_ERROR).end();
            },
        );
    },
);

app.get('/email/', keycloak.protect(KeycloakRoles.MARKTMEESTER), function(req, res) {
    res.render('EmailPage');
});

app.get('/mail/:marktId/:marktDate/:erkenningsNummer/indeling', keycloak.protect(KeycloakRoles.MARKTMEESTER), function(
    req,
    res,
) {
    const mailContextPromise = getMailContext(
        req.session.token,
        req.params.marktId,
        req.params.erkenningsNummer,
        req.params.marktDate,
    );
    mailContextPromise.then(
        props => {
            const subject = `Martindeling ${props.markt.naam} ${formatDate(props.marktDate)}`;
            props.subject = subject;

            res.render('EmailIndeling', props);

            if (req.query.mailto) {
                const to = req.query.mailto;
                mail({
                    from: to,
                    to,
                    subject,
                    react: <EmailIndeling {...props} />,
                }).then(
                    () => {
                        console.log(`E-mail is verstuurd naar ${to}`);
                    },
                    err => {
                        console.error(`E-mail sturen naar ${to} is mislukt`, err);
                    },
                );
            }
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end();
        },
    );
});

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
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('VoorrangslijstPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, user });
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

const dashboardPage = (req, res, erkenningsNummer) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(req.session.token, erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(erkenningsNummer);
    const marktenPromise = getMarkten(req.session.token);
    const marktenPromiseProps = marktenPromise.then(markten => {
        const propsPromise = markten.map(markt => {
            return getMarktProperties(markt.id).then(props => ({
                ...markt,
                ...props,
            }));
        });

        return Promise.all(propsPromise);
    });
    Promise.all([
        ondernemerPromise,
        marktenPromiseProps,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(erkenningsNummer),
    ]).then(
        ([ondernemer, markten, plaatsvoorkeuren, aanmeldingen]) => {
            res.render('OndernemerDashboard', {
                ondernemer,
                aanmeldingen,
                markten,
                plaatsvoorkeuren,
                startDate: tomorrow(),
                endDate: nextWeek(),
                messages,
                user: req.session.token,
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/dashboard/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    dashboardPage(req, res, getErkenningsNummer(req));
});

app.get('/ondernemer/:erkenningsNummer/dashboard/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    dashboardPage(req, res, req.params.erkenningsNummer);
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

app.get('/ondernemer/:erkenningsNummer/activatie-qr.svg', keycloak.protect(KeycloakRoles.MARKTMEESTER), function(
    req,
    res,
) {
    getMarktondernemer(req.session.token, req.params.erkenningsNummer).then(ondernemer => {
        const params = {
            username: req.params.erkenningsNummer,
            code: ondernemer.pasUid,
        };

        const activationURL = `${req.protocol}://${req.headers.host}/activeren${qs.stringify(params, {
            addQueryPrefix: true,
        })}`;

        /*
         * FIXME: The <QRCode> React component doesn't output the `xmlns` attribute,
         * image only get's displayed as `text/html`.
         */
        res.set({
            // 'Content-Type': 'image/svg+xml; charset=UTF-8',
        });

        res.render('QRCodeImage', {
            value: activationURL,
        });
    }, httpErrorPage(res, HTTP_PAGE_NOT_FOUND));
});

app.get('/activeren', activationPage);

app.post('/activeren', handleActivation);

app.get('/registreren', registrationPage);

app.post('/registreren', handleRegistration);

app.get('/herstellen', (req, res) => {
    res.render('PasswordRecoveryPage', {
        username: req.query.username,
    });
});

app.post('/herstellen', (req, res) => {
    if (req.body && req.body.username) {
        const { username } = req.body;
        getKeycloakAdmin()
            .then(
                kcAdminClient =>
                    kcAdminClient.users
                        .findOne({ username })
                        .then(requireOne)
                        .then(user =>
                            kcAdminClient.users.executeActionsEmail({
                                id: trace(user).id,
                                lifespan: 3600,
                                actions: ['UPDATE_PASSWORD'],
                            }),
                        ),
                traceError(`Password reset for unknown user: ${username}`),
            )
            .then(() => {
                res.redirect('/login?message=password-recovery-mail');
            }, httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR)('Password reset failed'));
    } else {
        httpErrorPage(res, HTTP_PAGE_NOT_FOUND)('Missing username');
    }
});

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

app.get('/api/0.0.1/markt/:marktId/plaats-count/:count/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    Promise.all([
        getMarktPaginas(req.params.marktId),
        getMarktProperties(req.params.marktId),
        getMarktplaatsen(req.params.marktId),
    ]).then(
        ([paginas, marktProperties, marktplaatsen]) => {
            res.set({
                'Content-Type': 'application/json; charset=UTF-8',
            });
            const rows = (
                marktProperties.rows ||
                paginas.reduce(
                    (list, pagina) => [
                        ...list,
                        ...pagina.indelingslijstGroup.map(group => group.plaatsList).filter(Array.isArray),
                    ],
                    [],
                )
            ).map(row =>
                row
                    .map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId))
                    .map(plaats => plaats.plaatsId),
            );
            const rowMinLength = rows.filter(row => row.length >= req.params.count);
            /*
             *console.log(rowMinLength);
             * const rowsObj = rowMinLength.reduce((total, row, i) => {
             *     row.map((plaatsId, j) => {
             *         let n = [];
             *         (row[j - 1]) && n.push(row[j - 1]);
             *         (row[j + 1]) && n.push(row[j + 1]);
             *         if (n.length) {
             *             total[plaatsId] = n;
             *         }
             *     })
             *     return total;
             * }, {})
             */

            res.send(JSON.stringify(rowMinLength));
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end();
        },
    );
});

const ondernemerChangeBranchePage = (res, token, erkenningsNummer, query) => {
    const ondernemerPromise = getMarktondernemer(token, erkenningsNummer);
    const branchesPromise = getAllBranches();

    const marktenPromise = ondernemerPromise.then(ondernemer =>
        Promise.all(
            ondernemer.sollicitaties.map(soll =>
                Promise.all([getMarkt(token, soll.markt.id), getBranches(soll.markt.id)]),
            ),
        ),
    );
    Promise.all([ondernemerPromise, branchesPromise]).then(
        ([ondernemer, branches]) => {
            res.render('OndernemerBranchePage', {
                ondernemer,
                branches,
                query,
                user: token,
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/branche/:erkenningsNummer/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    ondernemerChangeBranchePage(res, req.session.token, req.params.erkenningsNummer, req.query);
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

const voorkeurenPage = (req, res, token, erkenningsNummer, query, currentMarktId, role) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(token, erkenningsNummer);
    const marktenPromise = ondernemerPromise
        .then(ondernemer =>
            Promise.all(
                ondernemer.sollicitaties
                    .filter(sollicitatie => !sollicitatie.doorgehaald)
                    .map(sollicitatie => sollicitatie.markt.id)
                    .map(marktId => getMarkt(token, marktId)),
            ),
        )
        .then(markten =>
            Promise.all(
                (currentMarktId ? markten.filter(markt => String(markt.id) === currentMarktId) : markten).map(markt =>
                    getMarktplaatsen(markt.id).then(marktplaatsen => ({
                        ...markt,
                        marktplaatsen,
                    })),
                ),
            ),
        );

    Promise.all([
        ondernemerPromise,
        marktenPromise,
        getOndernemerVoorkeuren(erkenningsNummer),
        getMarktPaginas(currentMarktId),
        getMarktProperties(currentMarktId),
        getMarktplaatsen(currentMarktId),
        getIndelingVoorkeur(erkenningsNummer, currentMarktId),
    ]).then(
        ([ondernemer, markten, plaatsvoorkeuren, marktPaginas, marktProperties, marktPlaatsen, indelingVoorkeur]) => {
            res.render('VoorkeurenPage', {
                ondernemer,
                markten,
                plaatsvoorkeuren,
                marktPaginas,
                marktProperties,
                marktPlaatsen,
                indelingVoorkeur,
                query,
                user: req.user,
                messages,
                role,
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/voorkeuren/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    voorkeurenPage(
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
        voorkeurenPage(
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

const algemeneVoorkeurenPage = (req, res, token, erkenningsNummer, marktId, marktDate, role) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(token, erkenningsNummer);
    const marktPromise = marktId ? getMarkt(token, marktId) : Promise.resolve(null);

    // TODO: Only allow relative URLs in `next`, to prevent redirection to 3rd party phishing sites
    const next = req.query.next;
    const query = req.query;

    Promise.all([
        ondernemerPromise,
        marktPromise,
        getIndelingVoorkeur(erkenningsNummer, marktId, marktDate),
        getAllBranches(),
    ]).then(
        ([ondernemer, markt, voorkeur, branches]) => {
            res.render('AlgemeneVoorkeurenPage', {
                ondernemer,
                markt,
                marktId,
                voorkeur,
                branches,
                next,
                query,
                messages,
                role,
            });
        },
        err => errorPage(res, err),
    );
};

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

const algemeneVoorkeurenFormData = body => {
    const { erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting } = body;

    const inactive = !!body.inactive;
    const anywhere = !!body.anywhere;
    const aantalPlaatsen = parseInt(body.aantalPlaatsen, 10) || null;

    const voorkeur = {
        erkenningsNummer,
        marktId: marktId || null,
        marktDate: marktDate || null,
        anywhere,
        aantalPlaatsen,
        brancheId: brancheId || null,
        parentBrancheId: parentBrancheId || null,
        inrichting: inrichting || null,
        inactive,

        monday: !!body.monday,
        tuesday: !!body.tuesday,
        wednesday: !!body.wednesday,
        thursday: !!body.thursday,
        friday: !!body.friday,
        saturday: !!body.saturday,
        sunday: !!body.sunday,
    };

    return voorkeur;
};

app.get('/markt-detail/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res, next) =>
    marktDetailController(req, res, next, getErkenningsNummer(req)),
);

app.get(
    '/ondernemer/:erkenningsNummer/markt-detail/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => marktDetailController(req, res, next, req.params.erkenningsNummer),
);

const handleAlgemeneVoorkeurenPost = (req, res) => {
    const { next } = req.body;

    const data = algemeneVoorkeurenFormData(req.body);

    const { erkenningsNummer, marktId, marktDate } = data;

    upsert(
        models.voorkeur,
        {
            erkenningsNummer,
            marktId,
            marktDate,
        },
        data,
    ).then(
        () => res.status(HTTP_CREATED_SUCCESS).redirect(next ? next : '/'),
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
};

app.post(
    ['/algemene-voorkeuren/', '/algemene-voorkeuren/:marktId/', '/algemene-voorkeuren/:marktId/:marktDate/'],
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res, next) => handleAlgemeneVoorkeurenPost(req, res, next, getErkenningsNummer(req)),
);

app.post(
    [
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/',
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
        '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/:marktDate/',
    ],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => handleAlgemeneVoorkeurenPost(req, res, next, req.params.erkenningsNummer),
);

app.get('/algemene-voorkeuren/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    algemeneVoorkeurenPage(
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
    algemeneVoorkeurenPage(
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
    algemeneVoorkeurenPage(
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
        algemeneVoorkeurenPage(
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
        algemeneVoorkeurenPage(
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
        algemeneVoorkeurenPage(
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

const voorkeurenFormDataToObject = formData => ({
    marktId: parseInt(formData.marktId, 10),
    erkenningsNummer: formData.erkenningsNummer,
    plaatsId: formData.plaatsId,
    priority: parseInt(formData.priority, 10),
});

const handleVoorkeurenPost = (req, res, next, erkenningsNummer) => {
    /*
     * TODO: Form data format validation
     * TODO: Business logic validation
     */

    const { redirectTo } = req.body;

    const removeExisting = () =>
        models.plaatsvoorkeur
            .destroy({
                where: {
                    erkenningsNummer,
                },
            })
            .then(n => console.log(`${n} Bestaande voorkeuren verwijderd...`));

    const ignoreEmptyVoorkeur = voorkeur => !!voorkeur.plaatsId;

    const insertFormData = () => {
        console.log(`${req.body.plaatsvoorkeuren.length} (nieuwe) voorkeuren opslaan...`);

        const voorkeuren = req.body.plaatsvoorkeuren
            .map(voorkeurenFormDataToObject)
            .map(plaatsvoorkeur => ({
                ...plaatsvoorkeur,
                erkenningsNummer,
            }))
            .filter(ignoreEmptyVoorkeur);

        return models.plaatsvoorkeur.bulkCreate(voorkeuren);
    };
    const insertAlgVoorkeurFormData = () => {
        console.log(`algemene voorkeuren opslaan...`);
        const data = algemeneVoorkeurenFormData(req.body);
        const { marktId, marktDate } = data;

        return upsert(
            models.voorkeur,
            {
                erkenningsNummer,
                marktId,
                marktDate,
            },
            data,
        );
    };

    // TODO: Remove and insert in one transaction
    removeExisting()
        .then(insertFormData)
        .then(insertAlgVoorkeurFormData)
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(redirectTo),
            error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
        );
};

app.post(['/voorkeuren/', '/voorkeuren/:marktId/'], keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res, next) =>
    handleVoorkeurenPost(req, res, next, getErkenningsNummer(req)),
);

app.post(
    ['/ondernemer/:erkenningsNummer/voorkeuren/', '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/'],
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    (req, res, next) => handleVoorkeurenPost(req, res, next, req.params.erkenningsNummer),
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

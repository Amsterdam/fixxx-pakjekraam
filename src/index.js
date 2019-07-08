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
const models = require('./model/index.js');
const { sequelize } = require('./model/index.js');
const morgan = require('morgan');
const url = require('url');
const qs = require('qs');
const { isErkenningsnummer, slugifyMarkt, isVast, filterRsvpList } = require('./domain-knowledge.js');
const { checkActivationCode, readOnlyLogin } = require('./makkelijkemarkt-auth.js');
const { login, getMarkt, getMarktondernemer, getMarktondernemersByMarkt } = require('./makkelijkemarkt-api.js');
const {
    splitByValueArray,
    tomorrow,
    nextWeek,
    addDays,
    endOfWeek,
    requireOne,
    toISODate,
    trace,
    traceError,
} = require('./util.js');
const { getKeycloakAdmin, userExists } = require('./keycloak-api.js');
const { mail } = require('./mail.js');
const EmailIndeling = require('./views/EmailIndeling.jsx');
const EmailWijzigingAanmeldingen = require('./views/EmailWijzigingAanmeldingen.jsx');
const EmailWijzigingVoorkeuren = require('./views/EmailWijzigingVoorkeuren.jsx');

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
} = require('./pakjekraam-api.js');

const HTTP_CREATED_SUCCESS = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN_ERROR = 403;
const HTTP_PAGE_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_DEFAULT_PORT = 8080;

const httpErrorPage = (res, errorCode) => err => {
    console.log(err);
    res.status(errorCode).end(`${err}`);
};

const internalServerErrorPage = res => httpErrorPage(HTTP_INTERNAL_SERVER_ERROR);

const forbiddenErrorPage = res => httpErrorPage(HTTP_FORBIDDEN_ERROR);

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

const pgPool = new PgPool(parseDatabaseURL(process.env.DATABASE_URL));

const errorPage = (res, err) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
};

/*
 * The built-in Sequelize `upsert()` doesn't work well with
 * combined unique key constraints that allow NULL values.
 */
const upsert = (model, where, data) =>
    model
        .findOrCreate({
            where,
            defaults: data,
        })
        .spread((inst, created) => (created ? inst : inst.update(data)));

app.use(morgan(morgan.compile(':date[iso] :method :status :url :response-time ms')));

// This health check page is required for Docker deployments
app.get('/status/health', function(req, res) {
    res.end('OK!');
});

app.get('/status/database', function(req, res) {
    sequelize
        .authenticate()
        .then(() => {
            res.end('Database OK!');
        })
        .catch(err => {
            errorPage(res, 'Unable to connect to the database');
        });
});

app.get('/status/keycloak', function(req, res) {
    getKeycloakAdmin()
        .then(kcAdminClient =>
            kcAdminClient.realms.findOne({
                realm: process.env.IAM_REALM,
            }),
        )
        .then(() => {
            res.end('Keycloak OK!');
        })
        .catch(err => {
            errorPage(res, 'Unable to connect to the Keycloak');
        });
});

app.get('/status/makkelijkemarkt', function(req, res) {
    readOnlyLogin()
        .then(() => {
            res.end('Makkelijke Markt API OK!');
        })
        .catch(err => {
            errorPage(res, 'Unable to connect to Makkelijke Markt API');
        });
});

// Required for Passport login form
app.use(bodyParser.urlencoded({ extended: true }));

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

const KeycloakRoles = {
    MARKTBUREAU: 'marktbureau',
    MARKTMEESTER: 'marktmeester',
    MARKTONDERNEMER: 'marktondernemer',
};

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
    res.render('HomePage');
});

app.get(
    '/mail/:marktId/:marktDate/:erkenningsNummer/aanmeldingen',
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
    function(req, res) {
        const ondernemerPromise = getMarktondernemer(req.user.token, req.params.erkenningsNummer);
        const marktPromise = getMarkt(req.user.token, req.params.marktId);
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
            req.user.token,
            req.params.marktId,
            req.params.erkenningsNummer,
            req.params.marktDate,
        );
        const ondernemerPromise = getMarktondernemer(req.user.token, req.params.erkenningsNummer);
        const marktPromise = getMarkt(req.user.token, req.params.marktId);
        const voorkeurenPromise = getVoorkeurenMarktOndern(req.params.marktId, req.params.erkenningsNummer);
        Promise.all([ondernemerPromise, marktPromise, voorkeurenPromise]).then(
            ([ondernemer, markt, voorkeuren]) => {
                const marktDate = new Date(req.params.marktDate);
                const subject = `Markt ${markt.naam} - plaatsvoorkeur wijziging`;

                const voorkeurenObjPrio = (voorkeuren || []).reduce(function(hash, voorkeur) {
                    if (!hash.hasOwnProperty(voorkeur.dataValues.priority)) hash[voorkeur.dataValues.priority] = [];
                    hash[voorkeur.dataValues.priority].push(voorkeur.dataValues);

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
        req.user.token,
        req.params.marktId,
        req.params.erkenningsNummer,
        req.params.marktDate,
    );
    mailContextPromise.then(
        props => {
            const subject = `Marktindeling ${props.markt.naam}`;

            let template;
            if (isVast(props.ondernemer.status) && props.inschrijving) {
                template = emailTypes.mail01;
                if (props.voorkeuren.length && !props.toewijzing) {
                    template = emailTypes.mail01;
                } else if (props.voorkeuren.length && props.toewijzing) {
                    template = emailTypes.mail02;
                }
            } else if (props.inschrijving) {
                template = emailTypes.mail04;
                if (props.voorkeuren.length && !props.afwijzing && !props.toewijzing) {
                    template = emailTypes.mail05;
                } else if (props.voorkeuren.length && !props.afwijzing && props.toewijzing) {
                    template = emailTypes.mail06;
                }
            }

            props.template = template;

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

const publicErrors = {
    INCORRECT_CREDENTIALS: 'incorrect-credentials',
    AANWEZIGHEID_SAVED: 'aanwezigheid-saved',
    PLAATSVOORKEUREN_SAVED: 'plaatsvoorkeuren-saved',
    ALGEMENE_VOORKEUREN_SAVED: 'algemene-voorkeuren-saved',
    ACTIVATION_FAILED: 'activation-failed',
    NON_MATCHING_PASSWORDS: 'non-matching-passwords',
};

const humanReadableMessage = {
    [publicErrors.INCORRECT_CREDENTIALS]: 'Uw gebruikersnaam of wachtwoord is incorrect.',
    [publicErrors.AANWEZIGHEID_SAVED]: 'Je aan- of afmeldingen zijn met success gewijzigd.',
    [publicErrors.PLAATSVOORKEUREN_SAVED]: 'Je plaatsvoorkeuren zijn met success gewijzigd.',
    [publicErrors.ALGEMENE_VOORKEUREN_SAVED]: 'Je marktprofiel is met success gewijzigd.',
    [publicErrors.ACTIVATION_FAILED]:
        'De ingevoerde activatie-code klopt niet of is verlopen. Controleer de ingevulde gegevens.',
    [publicErrors.NON_MATCHING_PASSWORDS]:
        'De ingevoerde wachtwoorden komen niet overeen. Let op dat je geen fout maakt bij het kiezen van een wachtwoord.',
};

/*
 * Error message codes can be passed along via the query string, for example:
 *
 *     /login?error=incorrect-credentials
 *     /login?error[]=incorrect-request&error[]=database-down
 */
const getQueryErrors = queryParams => {
    const errorCodes = queryParams.error
        ? Array.isArray(queryParams.error)
            ? queryParams.error
            : [queryParams.error]
        : [];

    return errorCodes.map(msg => ({
        code: msg,
        message: humanReadableMessage[msg] || msg,
        severity: 'error',
    }));
};

const dashboardPage = (req, res, erkenningsNummer) => {
    const messages = getQueryErrors(req.query);
    const user = req.session.token;
    const ondernemerPromise = getMarktondernemer(user, req.params.erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(req.params.erkenningsNummer);
    const marktenPromise = getMarkten(user, req.params.marktId);
    const marktenPromiseProps = marktenPromise.then(markten => {
        const propsPromise = markten.map(markt => {
            return getMarktProperties(markt.id).then(props => {
                markt.properties = props;

                return markt;
            });
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
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/dashboard/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    dashboardPage(req, res, getErkenningsNummer(req));
});

app.get('/dashboard/:erkenningsNummer/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    dashboardPage(req, res, req.params.erkenningsNummer);
});

app.get('/login', keycloak.protect(), (req, res) => {
    readOnlyLogin().then(sessionData => {
        Object.assign(req.session, sessionData);

        if (isMarktondernemer(req)) {
            res.redirect('/dashboard');
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

app.get('/activeren', (req, res) => {
    res.render('ActivatePage', {
        username: req.query.username,
        code: req.query.code,
        messages: getQueryErrors(req.query),
    });
});

app.post('/activeren', (req, res) => {
    const { username, code } = req.body;
    checkActivationCode(username, code)
        .then(ondernemer => userExists(username))
        .then(isExistingUser => {
            console.log(username, isExistingUser);
            if (isExistingUser) {
                // Go to the activation failed page
                throw new Error();
            }

            return isExistingUser;
        })
        .then(
            () => {
                req.session.activation = {
                    username,
                };
                res.redirect('/registreren');
            },
            () => {
                res.redirect(
                    `/activeren${qs.stringify(
                        {
                            username,
                            code,
                            error: publicErrors.ACTIVATION_FAILED,
                        },
                        { addQueryPrefix: true },
                    )}`,
                );
            },
        );
});

app.get('/registreren', (req, res) => {
    if (req.session.activation) {
        res.render('RegistrationPage', {
            code: req.session.activation.code,
            email: req.query.email,
            messages: getQueryErrors(req.query),
            username: req.session.activation.username,
        });
    } else {
        res.redirect('/activeren');
    }
});

app.post('/registreren', (req, res) => {
    if (req.session.activation) {
        const { password, email } = req.body;

        if (req.body.password !== req.body.passwordRepeat) {
            res.redirect(
                `/registreren${qs.stringify(
                    { email, error: publicErrors.NON_MATCHING_PASSWORDS },
                    {
                        addQueryPrefix: true,
                    },
                )}`,
            );
        }

        const userDefinition = {
            username: req.session.activation.username,
            email,
            enabled: true,
        };

        getKeycloakAdmin().then(kcAdminClient => {
            // const clientId = process.env.IAM_CLIENT_ID;
            const clientId = 'fea49ab9-656f-436c-a804-7925b4bfa08b';

            const clientPromise = kcAdminClient.clients
                .findOne({
                    clientId: process.env.IAM_CLIENT_ID,
                })
                .then(clients => clients[0]);

            const rolePromise = clientPromise.then(client =>
                kcAdminClient.clients.findRole(
                    trace({
                        id: client.id,
                        roleName: KeycloakRoles.MARKTONDERNEMER,
                    }),
                ),
            );

            const userPromise = kcAdminClient.users.create(userDefinition);

            Promise.all([clientPromise, rolePromise, userPromise])
                .then(([client, role, user]) => {
                    const passwordPromise = kcAdminClient.users.resetPassword({
                        id: user.id,
                        credential: {
                            temporary: false,
                            type: 'password',
                            value: password,
                        },
                    });

                    if (user.email) {
                        // TODO: How should we handle failure here?
                        kcAdminClient.users
                            .sendVerifyEmail({
                                id: user.id,
                            })
                            .then(
                                () => console.log('Verification e-mail sent.'),
                                () => console.log('Failed to send verification e-mail.'),
                            );
                    }

                    /*
                     * TODO: Currently `Keycloak.MARKTONDERNEMER` is the default role
                     * for all users, but we should ensure in this stage we add
                     * the role in case someone deletes this default setting.
                     * return rolePromise.then(role =>
                     *     kcAdminClient.users.addClientRoleMappings({
                     *         id: user.id,
                     *         clientUniqueId: client.id,
                     *         roles: [
                     *             {
                     *                 id: role.id,
                     *                 name: role.name,
                     *             },
                     *         ],
                     *     }),
                     * );
                     */

                    /*
                     * TODO: When setting up the initial password fails,
                     * should we roll back and delete the new user?
                     */

                    return passwordPromise.then(result => {
                        console.log('Password reset', result);
                    });
                })
                .then(x => {
                    delete req.session.activation;
                    res.redirect('/welkom');
                })
                .catch(httpErrorPage(res, HTTP_INTERNAL_SERVER_ERROR));
        });
    } else {
        forbiddenErrorPage(res);
    }
});

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
                                id: trace(user, 'Recovery user:').id,
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

app.get('/makkelijkemarkt/api/1.1.0/markt/:marktId', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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

app.get('/makkelijkemarkt/api/1.1.0/markt/', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
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

app.get('/makkelijkemarkt/api/1.1.0/lijst/week/:marktId', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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

app.get('/api/0.0.1/markt/:marktId/branches.json', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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
    keycloak.protect(KeycloakRoles.MARKTMEESTER),
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

app.get('/api/0.0.1/markt/:marktId/voorkeuren.json', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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

const afmeldPage = (res, token, erkenningsNummer, currentMarktId, query) => {
    const ondernemerPromise = getMarktondernemer(token, erkenningsNummer);
    const marktenPromise = ondernemerPromise.then(ondernemer =>
        Promise.all(
            ondernemer.sollicitaties
                .map(sollicitatie => sollicitatie.markt.id)
                .map(marktId => getMarkt(token, marktId)),
        ),
    );
    Promise.all([ondernemerPromise, marktenPromise, getAanmeldingenByOndernemer(erkenningsNummer)]).then(
        ([ondernemer, markten, aanmeldingen]) => {
            res.render('AfmeldPage', {
                ondernemer,
                aanmeldingen,
                markten,
                startDate: tomorrow(),
                endDate: nextWeek(),
                currentMarktId,
                query,
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/afmelden/:erkenningsNummer/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    afmeldPage(res, req.session.token, req.params.erkenningsNummer, req.query);
});

app.get('/afmelden/:erkenningsNummer/:marktId', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    afmeldPage(res, req.session.token, req.params.erkenningsNummer, req.params.marktId, req.query);
});

app.post('/afmelden/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    /*
     * TODO: Form data format validation
     * TODO: Business logic validation
     */

    const { erkenningsNummer, next } = req.body;
    const responses = req.body.rsvp.map(rsvp => ({
        ...rsvp,
        attending: rsvp.attending === 'true',
        erkenningsNummer,
    }));

    // TODO: Redirect with success code
    Promise.all(
        responses.map(response => {
            const { marktId, marktDate } = response;

            return upsert(
                models.rsvp,
                {
                    erkenningsNummer,
                    marktId,
                    marktDate,
                },
                response,
            );
        }),
    ).then(
        () => res.status(HTTP_CREATED_SUCCESS).redirect(next),
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
});

const aanmeldPage = (res, token, erkenningsNummer, marktId, query) => {
    Promise.all([
        getMarktondernemer(token, erkenningsNummer),
        getAanmeldingenByOndernemer(erkenningsNummer),
        getMarkt(token, marktId),
    ]).then(
        ([ondernemer, aanmeldingen, markt]) => {
            res.render('AanmeldPage', { ondernemer, aanmeldingen, markt, date: tomorrow() });
        },
        err => errorPage(res, err),
    );
};

app.get('/aanmelden/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    aanmeldPage(res, req.session.token, req.user.erkenningsNummer);
});

app.get('/aanmelden/:erkenningsNummer/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    aanmeldPage(res, req.session.token, req.params.erkenningsNummer);
});

app.get('/aanmelden/:erkenningsNummer/:marktId', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    aanmeldPage(res, req.session.token, req.params.erkenningsNummer, req.params.marktId, req.query);
});

const aanmeldFormDataToRSVP = formData => ({
    marktId: parseInt(formData.marktId, 10),
    marktDate: formData.aanmelding,
    erkenningsNummer: parseInt(formData.erkenningsNummer, 10),
    attending: true,
});

app.post('/aanmelden/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    const { next } = req.body;
    models.rsvp
        .create(aanmeldFormDataToRSVP(req.body))
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(next ? next : '/'),
            error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
        );
});

const voorkeurenPage = (req, res, token, erkenningsNummer, query, currentMarktId) => {
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
    ]).then(
        ([ondernemer, markten, plaatsvoorkeuren, marktPaginas, marktProperties, marktPlaatsen]) => {
            res.render('VoorkeurenPage', {
                ondernemer,
                markten,
                plaatsvoorkeuren,
                marktPaginas,
                marktProperties,
                marktPlaatsen,
                query,
                user: req.user,
                messages,
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/voorkeuren/:erkenningsNummer/:marktId', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    voorkeurenPage(req, res, req.session.token, req.params.erkenningsNummer, req.query, req.params.marktId);
});

const algemeneVoorkeurenPage = (req, res, token, erkenningsNummer, marktId, marktDate) => {
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

app.get('/markt-detail/:erkenningsNummer/:marktId/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getMarktondernemer(req.session.token, req.params.erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(req.params.erkenningsNummer);
    const marktPromise = req.params.marktId ? getMarkt(req.session.token, req.params.marktId) : Promise.resolve(null);
    const query = req.query;
    const next = req.query.next;

    Promise.all([
        ondernemerPromise,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(req.params.erkenningsNummer),
        marktPromise,
        getIndelingVoorkeur(req.params.erkenningsNummer, req.params.marktId),
        getAllBranches(),
    ]).then(
        ([ondernemer, plaatsvoorkeuren, aanmeldingen, markt, voorkeur, branches]) => {
            res.render('OndernemerMarktDetailPage', {
                ondernemer,
                plaatsvoorkeuren,
                aanmeldingen,
                markt,
                voorkeur,
                branches,
                marktId: req.params.marktId,
                next,
                query,
                messages,
            });
        },
        err => errorPage(res, err),
    );
});

app.post('/algemene-voorkeuren/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
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
});

app.get('/algemene-voorkeuren/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res, next) => {
    // TODO: Only allow access for role "marktondernemer"
    if (isErkenningsnummer(req.user.username)) {
        algemeneVoorkeurenPage(res, req.session.token, req.user.username);
    } else {
        next();
    }
});

app.get('/algemene-voorkeuren/:erkenningsNummer/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    algemeneVoorkeurenPage(req, res, req.session.token, req.params.erkenningsNummer);
});

app.get(
    '/algemene-voorkeuren/:erkenningsNummer/:marktId/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res) => {
        algemeneVoorkeurenPage(req, res, req.session.token, req.params.erkenningsNummer, req.params.marktId);
    },
);

app.get(
    '/algemene-voorkeuren/:erkenningsNummer/:marktId/:marktDate/',
    keycloak.protect(KeycloakRoles.MARKTONDERNEMER),
    (req, res) => {
        algemeneVoorkeurenPage(
            req,
            res,
            req.session.token,
            req.params.erkenningsNummer,
            req.params.marktId,
            req.params.marktDate,
        );
    },
);

const voorkeurenFormDataToObject = formData => ({
    marktId: parseInt(formData.marktId, 10),
    erkenningsNummer: formData.erkenningsNummer,
    plaatsId: formData.plaatsId,
    priority: parseInt(formData.priority, 10),
});

app.post('/voorkeuren/', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    /*
     * TODO: Form data format validation
     * TODO: Business logic validation
     */

    const { erkenningsNummer, redirectTo } = req.body;

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

    // TODO: Remove and insert in one transaction
    console.log(redirectTo);
    removeExisting()
        .then(insertFormData)
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(redirectTo),
            error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
        );
});

app.get('/profile', keycloak.protect(KeycloakRoles.MARKTONDERNEMER), (req, res) => {
    getMarktondernemer(req.session.token, getErkenningsNummer(req)).then(ondernemer => {
        res.render('ProfilePage', {
            user: {
                userType: 'marktondernemer',
            },
            ondernemer,
        });
    });
});

app.get('/profile/:erkenningsNummer', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
    getMarktondernemer(req.session.token, req.params.erkenningsNummer).then(
        ondernemer => {
            res.render('PublicProfilePage', { ondernemer, user: req.user });
        },
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
});

app.get('/markt/:marktId/:marktDate/markt.json', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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

app.get('/markt/:marktId/:marktDate/markt-indeling.json', keycloak.protect(KeycloakRoles.MARKTMEESTER), (req, res) => {
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

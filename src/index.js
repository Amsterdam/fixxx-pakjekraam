const connectPg = require('connect-pg-simple');
const express = require('express');
const reactViews = require('express-react-views');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const models = require('./model/index.js');
const morgan = require('morgan');
const { slugifyMarkt } = require('./domain-knowledge.js');
const { ensureLoggedIn } = require('connect-ensure-login');
const { requireAuthorization } = require('./makkelijkemarkt-auth.js');
const { login, getMarkt, getMarktondernemer, getMarktondernemersByMarkt } = require('./makkelijkemarkt-api.js');
const { tomorrow, nextWeek } = require('./util.js');
const {
    getAllBranches,
    getMarktProperties,
    getMarktPaginas,
    getIndelingslijst,
    getIndelingslijstInput,
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
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_DEFAULT_PORT = 8080;

const port = process.env.PORT || HTTP_DEFAULT_PORT;
const app = express();

const errorPage = (res, err) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
};

// Ensure the database tables have been created, particularly the session storage.
models.sequelize.sync().then(
    () => console.log('Database tables successfully initialized'),
    err => {
        console.log(err);
        process.exit(1);
    },
);

app.use(morgan(morgan.compile(':date[iso] :method :status :url :response-time ms')));

// Required for Passport login form
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        store: new (connectPg(session))({
            conString: process.env.DATABASE_URL,
        }),
        secret: process.env.APP_SECRET,
        resave: false,
        saveUninitialized: false,
    }),
);

// Initialize Passport and restore authentication state the session.
app.use(passport.initialize());
app.use(passport.session());

// This health check page is required for Docker deployments
app.get('/status/health', function(req, res) {
    res.end('OK!');
});

app.use((req, res, next) => {
    if (req.user && req.user.expiry && Date.now() > Date.parse(req.user.expiry)) {
        console.log('Token is expired, logout user');
        req.logout();
        res.redirect('/login');
    } else {
        next();
    }
});

// Initialize React JSX templates for server-side rendering
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', reactViews.createEngine({ beautify: true }));

app.get('/', function(req, res) {
    res.redirect('/markt/');
});

app.get('/email/', ensureLoggedIn(), function(req, res) {
    res.render('EmailPage');
});

app.get('/markt/', ensureLoggedIn(), function(req, res) {
    const user = req.user.token;
    getMarkten(req.user.token).then(markten => res.render('MarktenPage', { markten, user }));
});

app.get('/markt/:marktId/', ensureLoggedIn(), function(req, res) {
    const user = req.user.token;
    getMarkt(req.user.token, req.params.marktId).then(markt => res.render('MarktDetailPage', { markt, user }));
});

app.get('/markt/:marktId/:datum/indelingslijst/', ensureLoggedIn(), (req, res) => {
    const user = req.user.token;
    const datum = req.params.datum;
    const type = 'indelingslijst';
    getIndelingslijst(req.user.token, req.params.marktId, datum).then(
        data => {
            res.render('IndelingslijstPage', { data, datum, type, user });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/markt/:marktId/:datum/vasteplaatshouders/', ensureLoggedIn(), (req, res) => {
    const user = req.user.token;
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getIndelingslijstInput(req.user.token, req.params.marktId, datum).then(
        data => {
            res.render('VastplaatshoudersPage', { data, datum, type, user });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/markt/:marktId/:datum/sollicitanten/', ensureLoggedIn(), (req, res) => {
    const user = req.user.token;
    const datum = req.params.datum;
    const type = 'sollicitanten';
    getSollicitantenlijstInput(req.user.token, req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, user });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

const publicErrors = {
    INCORRECT_CREDENTIALS: 'incorrect-credentials',
    AANWEZIGHEID_SAVED: 'aanwezigheid-saved',
};

const humanReadableMessage = {
    [publicErrors.INCORRECT_CREDENTIALS]: 'Uw gebruikersnaam of wachtwoord is incorrect.',
    [publicErrors.AANWEZIGHEID_SAVED]: 'De wijzigingen zijn met success doorgevoerd',
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

app.get('/dashboard/:erkenningsNummer/', ensureLoggedIn(), function(req, res) {
    const messages = getQueryErrors(req.query);
    const user = req.user.token;
    const ondernemerPromise = getMarktondernemer(user, req.params.erkenningsNummer);
    const ondernemerVoorkeurenPromise = getOndernemerVoorkeuren(req.params.erkenningsNummer);
    const marktenPromise = ondernemerPromise.then(ondernemer =>
        Promise.all(
            ondernemer.sollicitaties.map(sollicitatie => sollicitatie.markt.id).map(marktId => getMarkt(user, marktId)),
        ),
    );
    Promise.all([
        ondernemerPromise,
        marktenPromise,
        ondernemerVoorkeurenPromise,
        getAanmeldingenByOndernemer(req.params.erkenningsNummer),
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
});

app.get('/login', function(req, res) {
    const messages = getQueryErrors(req.query);

    res.render('LoginPage', {
        messages,
    });
});

app.get('/ondernemer-login', function(req, res) {
    const messages = getQueryErrors(req.query);

    res.render('OndernemerLoginPage', {
        messages,
    });
});

app.post(
    '/login',
    passport.authenticate('local', { failureRedirect: `/login?error=${publicErrors.INCORRECT_CREDENTIALS}` }),
    function(req, res) {
        /*
         * TODO: Redirect to URL specified in URL query parameter,
         * so you go back to the page you intended to visit.
         */
        res.redirect(req.user.userType === 'ondernemer' ? '/dashboard/' + req.user.username : '/');
    },
);

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/makkelijkemarkt/api/1.1.0/markt/:marktId', ensureLoggedIn(), (req, res) => {
    getMarkt(req.user.token, req.params.marktId).then(
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

app.get('/makkelijkemarkt/api/1.1.0/markt/', ensureLoggedIn(), (req, res) => {
    getMarkten(req.user.token).then(
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

app.get('/makkelijkemarkt/api/1.1.0/marktondernemer/erkenningsnummer/:id', ensureLoggedIn(), (req, res) => {
    getMarktondernemer(req.user.token, req.params.id).then(
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
});

app.get('/makkelijkemarkt/api/1.1.0/lijst/week/:marktId', ensureLoggedIn(), (req, res) => {
    getMarktondernemersByMarkt(req.user.token, req.params.marktId).then(
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

app.get('/api/0.0.1/markt/:marktId/branches.json', ensureLoggedIn(), (req, res) => {
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

app.get('/api/0.0.1/markt/:marktId/:date/aanmeldingen.json', ensureLoggedIn(), (req, res) => {
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
});

app.get('/api/0.0.1/markt/:marktId/voorkeuren.json', ensureLoggedIn(), (req, res) => {
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

app.get('/api/0.0.1/markt/:marktId/plaats/:plaatsIds', ensureLoggedIn(), (req, res) => {
    const plaatsIds = req.params.plaatsIds.split('-');
    console.log(plaatsIds);

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
            ).map(row => row.map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId)));

            const expandable = rows
                .reduce((total, row) => {
                    row.reduce((t, plaats, i) => {
                        if (plaatsIds.includes(plaats.plaatsId)) {
                            row[i - 1] && total.push(row[i - 1].plaatsId);
                            row[i + 1] && total.push(row[i + 1].plaatsId);
                        }

                        return t;
                    }, []);

                    return total;
                }, [])
                .filter(plaatsId => !plaatsIds.includes(plaatsId));

            res.send(JSON.stringify(expandable));
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end();
        },
    );
});

app.get('/api/0.0.1/markt/:marktId/plaats-count/:count/', ensureLoggedIn(), (req, res) => {
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
            ).map(row => row.map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId)));

            const rowMinLength = rows.filter(row => row.length >= req.params.count);

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

app.get('/change-branche/:erkenningsNummer/', ensureLoggedIn(), (req, res) => {
    ondernemerChangeBranchePage(res, req.user.token, req.params.erkenningsNummer, req.query);
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

app.get('/afmelden/:erkenningsNummer/', ensureLoggedIn(), (req, res) => {
    afmeldPage(res, req.user.token, req.params.erkenningsNummer, req.query);
});

app.get('/afmelden/:erkenningsNummer/:marktId', ensureLoggedIn(), (req, res) => {
    afmeldPage(res, req.user.token, req.params.erkenningsNummer, req.params.marktId, req.query);
});

app.post('/afmelden/', ensureLoggedIn(), (req, res) => {
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
    models.rsvp
        .bulkCreate(responses)
        .then(
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

app.get('/aanmelden/', ensureLoggedIn(), (req, res) => {
    aanmeldPage(res, req.user.token, req.user.erkenningsNummer);
});

app.get('/aanmelden/:erkenningsNummer/', ensureLoggedIn(), (req, res) => {
    aanmeldPage(res, req.user.token, req.params.erkenningsNummer);
});

app.get('/aanmelden/:erkenningsNummer/:marktId', ensureLoggedIn(), (req, res) => {
    aanmeldPage(res, req.user.token, req.params.erkenningsNummer, req.params.marktId, req.query);
});

const aanmeldFormDataToRSVP = formData => ({
    marktId: parseInt(formData.marktId, 10),
    marktDate: formData.aanmelding,
    erkenningsNummer: parseInt(formData.erkenningsNummer, 10),
    attending: true,
});

app.post('/aanmelden/', ensureLoggedIn(), (req, res) => {
    const { next } = req.body;
    models.rsvp
        .create(aanmeldFormDataToRSVP(req.body))
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(next ? next : '/'),
            error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
        );
});

const voorkeurenPage = (res, token, erkenningsNummer, query, currentMarktId) => {
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

    Promise.all([ondernemerPromise, marktenPromise, getOndernemerVoorkeuren(erkenningsNummer)]).then(
        ([ondernemer, markten, plaatsvoorkeuren]) => {
            res.render('VoorkeurenPage', { ondernemer, markten, plaatsvoorkeuren, query, user: token });
        },
        err => errorPage(res, err),
    );
};

app.get('/voorkeuren/:erkenningsNummer/', ensureLoggedIn(), (req, res) => {
    voorkeurenPage(res, req.user.token, req.params.erkenningsNummer, req.query);
});

app.get('/voorkeuren/:erkenningsNummer/:marktId', ensureLoggedIn(), (req, res) => {
    voorkeurenPage(res, req.user.token, req.params.erkenningsNummer, req.query, req.params.marktId);
});

const voorkeurenFormDataToObject = formData => ({
    marktId: parseInt(formData.marktId, 10),
    erkenningsNummer: formData.erkenningsNummer,
    plaatsId: formData.plaatsId,
    priority: parseInt(formData.priority, 10),
});

app.post('/voorkeuren/', ensureLoggedIn(), (req, res) => {
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

    removeExisting()
        .then(insertFormData)
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(redirectTo),
            error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
        );
});

app.get('/profile', ensureLoggedIn(), (req, res) => {
    if (req.user.userType === 'ondernemer') {
        getMarktondernemer(req.user.token, req.user.erkenningsNummer).then(ondernemer => {
            res.render('ProfilePage', { user: req.user, ondernemer });
        });
    } else {
        res.render('ProfilePage', { user: req.user });
    }
});

app.get('/profile/:erkenningsNummer', ensureLoggedIn(), (req, res) => {
    getMarktondernemer(req.user.token, req.params.erkenningsNummer).then(
        ondernemer => {
            res.render('PublicProfilePage', { ondernemer, user: req.user });
        },
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
});

app.get('/markt/:marktId/:marktDate/markt.json', ensureLoggedIn(), (req, res) => {
    getIndelingslijstInput(req.user.token, req.params.marktId, req.params.marktDate).then(
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

app.get('/markt/:marktId/:marktDate/markt-indeling.json', ensureLoggedIn(), (req, res) => {
    getIndelingslijst(req.user.token, req.params.marktId, req.params.marktDate).then(
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

app.get('/markt-indeling/:marktId/:datum/', ensureLoggedIn(), (req, res) => {
    res.render('MarktIndelingPage', {});
});

// Static files that are public (robots.txt, favicon.ico)
app.use(express.static('./src/public/'));
app.use(express.static('./dist/public/'));

// Static files that require authorization (business logic scripts for example)
app.use(ensureLoggedIn(), express.static('./src/www/'));

app.listen(port, err => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Listening on port ${port}`);
    }
});

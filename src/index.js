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
    getIndelingslijstInput,
    getAanmeldingen,
    getAanmeldingenByOndernemer,
    getVoorkeuren,
    getBranches,
    getMarktplaatsen,
    getMarkten,
} = require('./pakjekraam-api.js');
const { calcToewijzingen, simulateAanmeldingen } = require('./www/script/controller.js');

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

app.get('/markt/', ensureLoggedIn(), function(req, res) {
    getMarkten(req.user.token).then(markten => res.render('MarktenPage', { markten }));
});

app.get('/markt/:marktId/', ensureLoggedIn(), function(req, res) {
    getMarkt(req.user.token, req.params.marktId).then(markt => res.render('MarktDetailPage', { markt }));
});

app.get('/markt/:marktId/:datum/indelingslijst/', ensureLoggedIn(), (req, res) => {
    const datum = req.params.datum;
    getIndelingslijstInput(req.user.token, req.params.marktId, datum).then(
        data => {
            res.render('IndelingslijstPage', { data, datum });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/markt/:marktId/:datum/sollicitanten/', ensureLoggedIn(), (req, res) => {
    getMarktondernemersByMarkt(req.user.token, req.params.marktId).then(
        ondernemers => {
            res.render('SollicitantenPage', { ondernemers });
        },
        err => {
            res.status(HTTP_INTERNAL_SERVER_ERROR).end(`${err}`);
        },
    );
});

app.get('/login', function(req, res) {
    res.render('LoginPage', {});
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login-error' }), function(req, res) {
    /*
     * TODO: Redirect to URL specified in URL query parameter,
     * so you go back to the page you intended to visit.
     */
    res.redirect('/');
});

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
    getVoorkeuren(req.params.marktId).then(
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

const afmeldPage = (res, token, erkenningsNummer, currentMarktId) => {
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
            });
        },
        err => errorPage(res, err),
    );
};

app.get('/afmelden/:erkenningsNummer/', ensureLoggedIn(), (req, res) => {
    afmeldPage(res, req.user.token, req.params.erkenningsNummer);
});

app.get('/afmelden/:erkenningsNummer/:marktId', ensureLoggedIn(), (req, res) => {
    afmeldPage(res, req.user.token, req.params.erkenningsNummer, req.params.marktId);
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

const aanmeldPage = (res, token, erkenningsNummer) => {
    Promise.all([getMarktondernemer(token, erkenningsNummer), getAanmeldingenByOndernemer(erkenningsNummer)]).then(
        ([ondernemer, aanmeldingen]) => {
            res.render('AanmeldPage', { ondernemer, aanmeldingen, date: tomorrow() });
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

const aanmeldFormDataToRSVP = formData => ({
    marktId: parseInt(formData.marktId, 10),
    marktDate: formData.aanmelding,
    erkenningsNummer: parseInt(formData.erkenningsNummer, 10),
    attending: true,
});

app.post('/aanmelden/', ensureLoggedIn(), (req, res) => {
    models.rsvp
        .create(aanmeldFormDataToRSVP(req.body))
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect('/'),
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
            res.render('PublicProfilePage', { ondernemer });
        },
        error => res.status(HTTP_INTERNAL_SERVER_ERROR).end(String(error)),
    );
});

app.get('/markt-indeling/:marktId/:marktDate/data.json', ensureLoggedIn(), (req, res) => {
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

app.get('/markt-indeling/:marktId/:datum/concept-indeling.json', ensureLoggedIn(), (req, res) => {
    getIndelingslijstInput(req.user.token, req.params.marktId).then(
        markt => {
            markt = simulateAanmeldingen(markt);

            console.time(`Berekenen indelingslijst`);
            markt.toewijzingen = calcToewijzingen(markt);
            console.timeEnd(`Berekenen indelingslijst`);

            res.set({
                'Content-Type': 'application/json; charset=UTF-8',
            });
            res.send(JSON.stringify(markt.toewijzingen, null, '  '));
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

const connectPg = require('connect-pg-simple');
const express = require('express');
const sass = require('node-sass');
const sassMiddleware = require('node-sass-middleware');
const reactViews = require('express-react-views');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const models = require('./model/index.js');
const { ensureLoggedIn } = require('connect-ensure-login');
const { requireAuthorization } = require('./makkelijkemarkt-auth.js');
const { login, getMarktondernemersByMarkt } = require('./makkelijkemarkt-api.js');
const {
    getLooplijstInput,
    getAanmeldingen,
    getVoorkeuren,
    getBranches,
    getMarktplaatsen,
    getMarkten,
} = require('./pakjekraam-api.js');
const { calcToewijzingen, simulateAanmeldingen } = require('./www/script/controller.js');

const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_DEFAULT_PORT = 8080;

const port = process.env.PORT || HTTP_DEFAULT_PORT;
const app = express();

// Ensure the database tables have been created, particularly the session storage.
models.sequelize.sync().then(
    () => console.log('Database tables successfully initialized'),
    err => {
        console.log(err);
        process.exit(1);
    },
);

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

// Initialize React JSX templates for server-side rendering
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', reactViews.createEngine({ beautify: true }));

app.get('/', function(req, res) {
    res.render('HomePage', {});
});

app.get('/markt/', ensureLoggedIn(), function(req, res) {
    getMarkten(req.user.token).then(markten => res.render('MarktenPage', { markten }));
});

app.get('/markt/:marktId/', ensureLoggedIn(), function(req, res) {
    getMarkten(req.user.token).then(markten => res.render('MarktenPage', { markten }));
});

app.get('/login', function(req, res) {
    res.render('LoginPage', {});
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login-error' }), function(req, res) {
    /*
     * TODO: Redirect to URL specified in URL query parameter,
     * so you go back to the page you intended to visit.
     */
    res.redirect('/markt/');
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
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

app.get('/markt-indeling/:marktId/data.json', ensureLoggedIn(), (req, res) => {
    getLooplijstInput(req.user.token, req.params.marktId).then(
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
    getLooplijstInput(req.user.token, req.params.marktId).then(
        markt => {
            markt = simulateAanmeldingen(markt);

            console.time(`Berekenen looplijst`);
            markt.toewijzingen = calcToewijzingen(markt);
            console.timeEnd(`Berekenen looplijst`);

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
app.use(
    express.static('./src/public/')
);

// Static files that require authorization (business logic scripts for example)
app.use(ensureLoggedIn(), express.static('./src/www/'));

app.use(
     sassMiddleware({
      src: path.join('./src/scss'),
      dest: path.join('./src/public/style'),
      debug: true
     })
);

app.listen(port, err => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Listening on port ${port}`);
    }
});

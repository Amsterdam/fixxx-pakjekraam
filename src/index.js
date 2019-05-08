const connectPg = require('connect-pg-simple');
const express = require('express');
const reactViews = require('express-react-views');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const models = require('./model/index.js');
const { ensureLoggedIn } = require('connect-ensure-login');
const { requireAuthorization } = require('./makkelijkemarkt-auth.js');
const { login, getMarkten } = require('./makkelijkemarkt-api.js');

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

app.get('/login', function(req, res) {
    res.render('LoginPage', {});
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login-error' }), function(req, res) {
    /*
     * TODO: Redirect to URL specified in URL query parameter,
     * so you go back to the page you intended to visit.
     */
    res.redirect('/api/1.0.0/markt/');
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/api/1.0.0/markt/', ensureLoggedIn(), (req, res) => {
    getMarkten(req.user.token).then(
        markten => {
            res.set({
                'Content-Type': 'application/json; charset=UTF-8',
            });
            res.send(JSON.stringify(markten));
        },
        err => {
            res.exit(HTTP_INTERNAL_SERVER_ERROR);
        },
    );
});

// Static files that are public (robots.txt, favicon.ico)
app.use(express.static('./src/public/'));

// Static files that require authorization (business logic scripts for example)
app.use(ensureLoggedIn(), express.static('./src/www/'));

app.listen(port, err => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Listening on port ${port}`);
    }
});

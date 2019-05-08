const express = require('express');
const reactViews = require('express-react-views');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const { ensureLoggedIn } = require('connect-ensure-login');
const { requireAuthorization } = require('./makkelijkemarkt-auth.js');
const { login, getMarkten } = require('./makkelijkemarkt-api.js');

const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_DEFAULT_PORT = 8080;

const port = process.env.PORT || HTTP_DEFAULT_PORT;
const app = express();

// Required for Passport login form
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({ secret: process.env.APP_SECRET, resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state the session.
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', reactViews.createEngine({ beautify: true }));

app.post('/login.html', passport.authenticate('local', { failureRedirect: '/login-error' }), function(req, res) {
    /*
     * TODO: Redirect to URL specified in URL query parameter,
     * so you go back to the page you intended to visit.
     */
    res.redirect('/api/1.0.0/markt/');
});

app.get('/', function(req, res) {
    res.render('HelloWorld', {});
});

app.get('/status/health', function(req, res) {
    res.end('OK!');
});

app.get('/login', function(req, res) {
    res.redirect('/login.html');
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

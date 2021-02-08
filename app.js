var createError = require('http-errors');
var express = require('express');
var path = require('path');
var session = require('express-session');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var logger = require('morgan');
var websocket = require("./websocket");
const common = require("./common_functions");
const database = require("./knexfile");
const knex = require('knex')(database.development);
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
var crypto = require('crypto');

function hashPassword (password, salt) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}


var app = express();

// Set instance to app
app.set('websocket', websocket);
app.set('knex', knex);

// Load Quiz teams
common.getJsonFile("/teams")
    .then(function (teamData) {
        app.set('teamData', teamData);
    })
    .catch((err) => { console.log(`app: cannot load teams file (${err})`) })


// Load Quiz questions
common.getJsonFile("/questions")
    .then(function (questionData) {
        app.set('questionData', questionData);
    })
    .catch((err) => { console.log(`app: cannot load questions file (${err})`) })


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
    key: 'user_sid',
    secret: "blaaaaat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 99999999999
    }
}));

app.use(passport.initialize());
app.use(passport.session());

//console.log(hashPassword("test123", "f14cf1eb19dc3e635c6dd7914ca55df2"))
passport.use(new LocalStrategy(
    function (username, password, done) {

        knex("users")
            .where({ username: username }).first()
            .then(user => {

                var hash = hashPassword(password, user.salt);
                // Found user, check password
                if (hash != user.password) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                console.log(`User ${username} logged in`);
                return done(null, user);


            })
            .catch(error => {
                return done(null, false, { message: `Incorrect username.` });
            })
    }
));

passport.serializeUser(function (user, done) {
    return done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    knex("users")
        .where({ id: id }).first()
        .then(user => {
            return done(null, user);
        })
        .catch(error => {
            return done(null, false);
        })
});

// Middleware to check of user is logged in.
var isAuthed = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login')
    }
}

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var authRouter = require('./routes/auth_routes');
var indexRouter = require('./routes/index_routes');
var quizRouter = require('./routes/quiz_routes');
var controlRouter = require('./routes/control_routes');
var scoreRouter = require('./routes/score_routes');

// Make specific modules public
app.use('/scripts/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/scripts/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.use('/scripts/reconnecting-websocket', express.static(__dirname + '/node_modules/reconnecting-websocket/dist/'));
app.use('/scripts/moment', express.static(__dirname + '/node_modules/moment/min'));
app.use('/scripts/icons', express.static(__dirname + '/node_modules/@mdi/font'));
app.use('/scripts/popper', express.static(__dirname + '/node_modules/popper.js/dist/umd'));
app.use('/scripts/handlebars', express.static(__dirname + '/node_modules/handlebars/dist'));

// Main route defenitions
app.use('/login', authRouter);
app.use('/', isAuthed, indexRouter);
app.use('/quiz', quizRouter);
app.use('/control', isAuthed, controlRouter);
app.use('/score', isAuthed, scoreRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

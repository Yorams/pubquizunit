var createError = require('http-errors');
var express = require('express');
var path = require('path');
//var session = require('express-session');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var websocket = require("./websocket");
const common = require("./common_functions");
const database = require("./knexfile");
const knex = require('knex')(database.development);

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

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// initialize express-session to allow us track the logged-in user across sessions.
/*
app.use(session({
    key: 'user_sid',
    secret: "blaaaaat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 99999999999
    }
}));
*/
var indexRouter = require('./routes/index_routes');
var quizRouter = require('./routes/quiz_routes');
var controlRouter = require('./routes/control_routes');
var scoreRouter = require('./routes/score_routes');

// Main route defenitions
app.use('/', indexRouter);
app.use('/quiz', quizRouter);
app.use('/control', controlRouter);
app.use('/score', scoreRouter);

// Make specific modules public
app.use('/scripts/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/scripts/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.use('/scripts/reconnecting-websocket', express.static(__dirname + '/node_modules/reconnecting-websocket/dist/'));
app.use('/scripts/moment', express.static(__dirname + '/node_modules/moment/min'));
app.use('/scripts/icons', express.static(__dirname + '/node_modules/@mdi/font'));
app.use('/scripts/popper', express.static(__dirname + '/node_modules/popper.js/dist/umd'));
app.use('/scripts/handlebars', express.static(__dirname + '/node_modules/handlebars/dist'));

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

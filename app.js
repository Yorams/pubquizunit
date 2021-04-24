var createError = require('http-errors');
var express = require('express');
var path = require('path');
var sessionParser = require('./session');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var logger = require('./logger')
const common = require("./common_functions");
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const rateLimit = require("express-rate-limit");

// Get settings
module.exports = common.getJsonFile("/settings").then(function (appSettings) {
    var app = express();

    app.set('appSettings', appSettings);

    appSettings.database.useNullAsDefault = true

    const knex = require('knex')(appSettings.database);

    // Set knex instance to app
    app.set('knex', knex);

    // Init logger
    var log = logger.app(path.parse(__filename).name);


    app.locals.env = "production"

    // Set rate limiter
    const limiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });



    // Check if users table is present
    knex("users")
        .where({ username: "admin" })
        .first()
        .then((row) => {
            if (typeof (row) == "undefined") {
                log.error("Database not initialized. Run npm install to initialize database automatically");
            }
        })
        .catch((error) => {
            log.error("Database not initialized. Run npm install to initialize database automatically");
        })

    // Update current count
    common.updateCurrentOrder(knex);

    // Load Quiz questions templates
    common.getJsonFile("/question_templates")
        .then(function (questionTemplates) {
            // Add default "message" question template.
            questionTemplates.unshift({
                "id": "message",
                "name": "Message",
                "parameters": [
                    {
                        "type": "message",
                        "name": "Bericht",
                        "id": "default"
                    }
                ]
            })

            app.set('questionTemplates', questionTemplates);
        })
        .catch((err) => { log.error(`app: cannot load questions template file (${err})`) })

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    // Session handler
    app.use(sessionParser.handler);

    // Passport authentication
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(
        function (username, password, done) {

            knex("users")
                .where({ username: username }).first()
                .then(user => {

                    var hash = common.hashPassword(password, user.salt);
                    // Found user, check password
                    if (hash != user.password) {
                        return done(null, false, { message: 'Incorrect password.' });
                    }
                    log.info(`User ${username} logged in`);
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

    // Web logger instance
    app.use(logger.express);

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    var authRouter = require('./routes/auth_routes');
    var userRouter = require('./routes/user_routes');
    var indexRouter = require('./routes/index_routes');
    var quizRouter = require('./routes/quiz_routes');
    var controlRouter = require('./routes/control_routes');
    var scoreRouter = require('./routes/score_routes');
    var teamsRouter = require('./routes/teams_routes');
    var questionsRouter = require('./routes/questions_routes');

    // Make specific modules public
    app.use('/scripts/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
    app.use('/scripts/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
    app.use('/scripts/reconnecting-websocket', express.static(__dirname + '/node_modules/reconnecting-websocket/dist/'));
    app.use('/scripts/moment', express.static(__dirname + '/node_modules/moment/min'));
    app.use('/scripts/icons', express.static(__dirname + '/node_modules/@mdi/font'));
    app.use('/scripts/popper', express.static(__dirname + '/node_modules/popper.js/dist/umd'));
    app.use('/scripts/handlebars', express.static(__dirname + '/node_modules/handlebars/dist'));
    app.use('/scripts/sortable', express.static(__dirname + '/node_modules/sortablejs'));
    app.use('/scripts/jquery-sortable', express.static(__dirname + '/node_modules/jquery-sortablejs/'));
    app.use('/scripts/tsparticles', express.static(__dirname + '/node_modules/tsparticles/dist/'));
    app.use('/scripts/jquery-particles', express.static(__dirname + '/node_modules/jquery-particles/dist/'));

    app.use('/login', limiter, authRouter);
    app.use('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // Main route defenitions
    app.use('/quiz', limiter, quizRouter);

    app.use('/', indexRouter);
    app.use('/user', common.isAuthed, userRouter);
    app.use('/control', common.isAuthed, controlRouter);
    app.use('/score', common.isAuthed, scoreRouter);
    app.use('/teams', common.isAuthed, teamsRouter);
    app.use('/questions', common.isAuthed, questionsRouter);

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

    return app;
})
    .catch((err) => {
        if (err.message.includes("ENOENT") && err.message.includes("settings")) {
            log.error(`Cannot load settings file: settings.json. You have to rename settings_empty.json to settings.json and alter the settings in de file.`)
        } else {
            log.error(err.stack)
        }
    })
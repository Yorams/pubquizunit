const common = require("../common_functions");
var path = require('path');
var logger = require('../logger')

// Init logger
var log = logger.app(path.parse(__filename).name);

exports.getPageContent = function (req, res) {
    var uuidIn = req.params.uuid
    var appSettings = req.app.get('appSettings');
    var knex = req.app.get('knex');

    if (typeof (uuidIn) !== "undefined") {
        // Get team data
        knex('teams')
            .where({ uuid: uuidIn })
            .first()
            .then((row) => {

                // Get quiz live state
                common.getSetting(knex, "quiz_live").then((quizLiveData) => {

                    if (typeof (row) !== "undefined") {
                        // Team found
                        var currentTeam = row
                        currentTeam.success = true;
                        currentTeam.quizLive = quizLiveData.value;

                        // Set last seen
                        knex('teams')
                            .where({ uuid: uuidIn })
                            .update({ "lastseen": knex.fn.now(), "status": "active" })
                            .then(() => log.info(`Quiz page is opened, team: ${uuidIn}`))
                            .catch((error) => log.warn(`Cannot set lastseen and status from team: ${uuidIn}, data: ${error}`))

                    } else {
                        // Team not found
                        var currentTeam = {
                            success: false
                        }
                    }

                    return res.render('quiz_main', { data: JSON.stringify(currentTeam), quizTitle: appSettings.quiz.title });
                });
            }).catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))
    } else {
        var currentTeam = {
            success: false
        }
        return res.render('quiz_main', { data: JSON.stringify(currentTeam), quizTitle: appSettings.quiz.title });
    }
}

exports.submitAnswer = function (req, res) {
    var teamUuid = req.body.teamUuid;
    var questionUuidIn = req.body.questionUuid;

    try {
        var answer = JSON.parse(req.body.answer);
    } catch (error) {
        log.warn(`Cannot parse answer from team: ${teamUuid}, data: ${req.body.answer}`)
        return res.send({ result: "error", errorMsg: `cannot parse answer` })
    }

    var knex = req.app.get('knex');

    if (typeof (answer) !== "undefined" && typeof (questionUuidIn) !== "undefined") {

        // Check if current team exists
        knex('teams')
            .where({ uuid: teamUuid })
            .first()
            .then((row) => {
                if (typeof (row) !== "undefined") {

                    // Get quiz live state
                    common.getSetting(knex, "quiz_live").then((quizLiveData) => {
                        if (quizLiveData.value) {
                            // Get current round and question ID from db
                            common.getCurrentQuestion(knex).then(currentQuestionUuid => {

                                // Check if answer is from current round & question
                                if (questionUuidIn == currentQuestionUuid) {

                                    // Check if current question is not a message
                                    common.getQuestion(knex, currentQuestionUuid).then((questionData) => {

                                        // Ignore answers for a messag type question
                                        if (questionData.template != "message") {
                                            // Check if answer is already given
                                            knex('answers')
                                                .where({ question_uuid: currentQuestionUuid, team_uuid: teamUuid })
                                                .first()
                                                .then((row) => {
                                                    if (typeof (row) === "undefined") {

                                                        // Compose data
                                                        var dbData = {
                                                            team_uuid: teamUuid,
                                                            question_uuid: currentQuestionUuid,
                                                            answer: JSON.stringify(answer)
                                                        }

                                                        // Save answer to database
                                                        knex('answers')
                                                            .insert(dbData)
                                                            .then(() => {
                                                                res.send({ result: "success" })
                                                                log.info(`Answer submitted, team: ${teamUuid}, question: ${currentQuestionUuid}, answer: ${JSON.stringify(answer)}`)
                                                            })
                                                            .catch((error) => res.send({ result: "error", errorMsg: `Cannot save answer: ${error}` }))
                                                    } else {
                                                        return res.send({ result: "error", errorMsg: `Answer is already given` })
                                                    }

                                                })
                                                .catch((error) => { common.errorHandler("Cannot get answer", error) })
                                        } else {
                                            log.warn(`Cannot answer a message type question from team: ${teamUuid}`)
                                            return res.send({ result: "error", errorMsg: `cannot answer a message type question` })
                                        }
                                    })
                                } else {
                                    log.warn(`Current question id mismatch from team: ${teamUuid}`)
                                    return res.send({ result: "error", errorMsg: `current question id mismatch` })
                                }

                            }).catch((error) => {
                                log.warn(`Cannot get current state: ${error}`);
                            })
                        } else {
                            log.warn(`User submitted answer while quiz is not live`);
                            return res.send({ result: "error", errorMsg: `quiz is not live` })
                        }
                    })
                } else {
                    log.warn(`Player not found: ${teamUuid}`);
                    return res.send({ result: "error", errorMsg: `player not found` })
                }
            }).catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))

    } else {
        log.warn(`Answer is undefined from team: ${teamUuid}`);
        return res.send({ result: "error", errorMsg: `answer is undefined` })
    }
}
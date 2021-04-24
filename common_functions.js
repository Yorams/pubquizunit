var fs = require('fs');
const { resolve } = require('path');
var path = require('path');
var crypto = require('crypto');
const passport = require('passport');
var _ = require('lodash');
var path = require('path');
var logger = require('./logger')

// Init logger
var log = logger

exports.getJsonFile = function (fileName) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path.join(__dirname, fileName + ".json"), 'utf8', function (err, contents) {
            if (err) return reject(err);
            resolve(JSON.parse(contents));
        });
    })
}

exports.saveJson = function (fileName, data, callback) {
    fs.writeFile(path.join(__dirname, fileName + ".json"), JSON.stringify(data), function (err) {
        if (err) return log.error(err);
        callback();
    });
}

exports.getTeam = function (uuidIn, teamData, callback) {
    var returnData = {};

    if (typeof (uuidIn) === "undefined") {
        returnData["success"] = false;
        returnData["errorMessage"] = "uuid not given";
        callback(returnData);
    } else {
        //// Check uuid //// 

        // Find team in data
        var currentTeam = teamData.find(function (obj) {
            return obj.uuid === uuidIn;
        })

        // Check if uuid is found
        if (typeof (currentTeam) !== "undefined") {
            returnData["success"] = true;
            returnData["team"] = currentTeam;

        } else {
            returnData["success"] = false;
            returnData["errorMessage"] = "uuid not found";
        }
        callback(returnData);
    }
}

exports.getCurrentQuestion = function (knex) {
    return new Promise(function (resolve, reject) {
        return knex('current_question')
            .where({ name: 'current' })
            .first()
            .then(row => { resolve(row.question) })
            .catch(error => reject(error))
    })
}

exports.updateCurrentQuestion = function (knex, questionUuid) {
    return new Promise(function (resolve, reject) {
        return knex('current_question')
            .where({ name: 'current' })
            .update({ question: questionUuid })
            .then(resolve())
            .catch(error => reject(error))
    })
}

exports.hashPassword = function (password, salt) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}



// Middleware to check of user is logged in.
exports.isAuthed = function (req, res, next) {

    if (req.isAuthenticated()) {
        next();
    } else {
        if (req.method == "GET") {
            // Send previous page with redirect
            res.redirect(`/login?r=${encodeURI(req.url)}`)
        } else if (req.method == "POST") {
            res.send({ result: "error", errorCode: "logged_out", errorMsg: "Login to continue." })
        }
    }
}

exports.errorHandler = function (action, error, req = false, res = false) {
    log.error(`${action}: ${error} \n ${error.stack}`)
    if (req != false) {
        res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot  ${action}` })
    }
}

/*
Current order is a array with all the info about rounds and questions without the question data.
Used for question order and the control mechanism (next, previous)
*/
var currentOrder = {}
exports.updateCurrentOrder = function (knex) {
    // Unpdate the question and round count.

    knex('rounds')
        .select("uuid", "order")
        .orderBy('order', 'asc')
        .then((rounds) => {
            knex('questions')
                .select("uuid", "round", "order")
                .orderBy('order', 'asc')
                .then((questions) => {


                    // Group by round
                    var grouped = _.groupBy(questions, function (obj) {
                        return obj.round;
                    });

                    // Add questions to rounds
                    for (rKey in rounds) {
                        if (typeof (grouped[rounds[rKey].uuid]) !== "undefined") {
                            // Questions
                            rounds[rKey].questions = grouped[rounds[rKey].uuid]

                            // Question count
                            rounds[rKey].questionCount = grouped[rounds[rKey].uuid].length
                        }
                    }
                    // Add round count to array
                    currentOrder.roundCount = rounds.length
                    currentOrder.rounds = rounds;
                })
                .catch((error) => { exports.errorHandler("Cannot get questions", error) })

        })
        .catch((error) => { exports.errorHandler("Cannot get rounds", error) })
}

exports.getCurrentOrder = function () {
    return currentOrder
}


exports.getQuestion = function (knex, questionUuid) {
    return new Promise(function (resolve, reject) {
        return knex.select([
            'questions.*',
            'rounds.name as round_name',
            'rounds.details as round_details',
            'rounds.uuid as round_uuid',
            'rounds.order as round_order'
        ])
            .where({ "questions.uuid": questionUuid })
            .from('questions')
            .leftJoin(
                'rounds',
                'questions.round',
                'rounds.uuid'
            )
            .first()
            .then(row => {
                if (typeof (row) != "undefined") {
                    // Parse parameters
                    row.parameters = JSON.parse(row.parameters)

                    // Strip answers from parameters
                    for (key in row.parameters) {
                        delete row.parameters[key].correct
                    }

                    resolve(row)
                } else {
                    throw new Error('question does not exists')
                }
            })
            .catch(error => reject(error))
    })
}

exports.getQuestions = function (knex) {
    return new Promise(function (resolve, reject) {
        knex('rounds')
            .orderBy('order', 'asc')
            .then((rounds) => {
                knex('questions')
                    .orderBy('order', 'asc')
                    .then((questions) => {

                        // Parse parameters
                        for (qKey in questions) {
                            try {
                                var parsedParameters = JSON.parse(questions[qKey].parameters)
                            } catch (error) {
                                log.error(error)
                            }
                            questions[qKey].parameters = parsedParameters

                        }

                        // Group by round
                        var grouped = _.groupBy(questions, function (obj) {
                            return obj.round;
                        });

                        // Add questions to rounds
                        for (rKey in rounds) {
                            if (typeof (grouped[rounds[rKey].uuid]) !== "undefined") {
                                rounds[rKey].questions = grouped[rounds[rKey].uuid]
                            }
                        }
                        resolve(rounds)
                    })
                    .catch(error => reject(error))
            })
            .catch(error => reject(error))
    })
}

exports.resetCurrent = function (knex) {
    var firstQuestonUuid = exports.getCurrentOrder().rounds[0].questions[0].uuid

    return new Promise(function (resolve, reject) {
        return exports.updateCurrentQuestion(knex, firstQuestonUuid)
            .then(resolve())
            .catch(error => reject(error))
    })
}

exports.getSetting = function (knex, settingId) {
    return new Promise(function (resolve, reject) {
        return knex('settings')
            .where({ id: settingId })
            .first()
            .then(row => {
                // Convert db entry to boolean
                if (row.type == "boolean") {
                    row.value = (row.value == "1") ? true : false
                }
                resolve(row)
            })
            .catch(error => {
                log.error(`Cannot get setting: ${settingId}`)
                reject(error)
            })
    })
}

exports.updateSetting = function (knex, settingId, value) {
    return new Promise(function (resolve, reject) {
        return knex('settings')
            .where({ id: settingId })
            .update({ value: value })
            .then(resolve())
            .catch(error => {
                log.error(`Cannot update setting: ${settingId}`)
                reject(error)
            })
    })
}
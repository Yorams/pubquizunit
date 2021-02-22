const common = require("../common_functions");

exports.getPageContent = function (req, res) {
    var guidIn = req.params.guid
    var appSettings = req.app.get('appSettings');
    var knex = req.app.get('knex');

    // Get team data
    knex('teams')
        .where({ guid: guidIn })
        .first()
        .then((row) => {
            if (typeof (row) !== "undefined") {
                var currentTeam = row
                currentTeam.success = true;
            } else {
                var currentTeam = {
                    success: false
                }
            }

            return res.render('quiz_main', { data: JSON.stringify(currentTeam), quizTitle: appSettings.quiz.title });
        }).catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))
}

exports.submitAnswer = function (req, res) {
    var guidIn = req.body.guid;
    var answer = JSON.parse(req.body.answer);
    var roundIn = req.body.round;
    var questionIn = req.body.question;
    var typeIn = req.body.type;
    var knex = req.app.get('knex');

    if (typeof (answer) !== "undefined" && typeof (typeIn) !== "undefined") {

        // Check if current team exists
        knex('teams')
            .where({ guid: guidIn })
            .first()
            .then((row) => {
                if (typeof (row) !== "undefined") {

                    // Get current round and question ID from db
                    common.getCurrent(knex).then(currentData => {

                        // Check if answer is from current round & question
                        if (roundIn == currentData.round) {
                            if (questionIn == currentData.question) {

                                var dbData = {
                                    guid: guidIn,
                                    type: typeIn,
                                    round: currentData.round,
                                    question: currentData.question,
                                    answer: JSON.stringify(answer)
                                }

                                // Save answer to database
                                knex('answers')
                                    .insert(dbData)
                                    .then(() => res.send({ result: "success" }))
                                    .catch((error) => res.send({ result: "error", errorMsg: `Cannot save answer: ${error}` }))

                            } else {
                                return res.send({ result: "error", errorMsg: `current question id mismatch` })
                            }
                        } else {
                            return res.send({ result: "error", errorMsg: `current round id mismatch` })
                        }
                    }).catch((error) => {
                        console.log(`Cannot get current state: ${error}`);
                    })
                } else {
                    return res.send({ result: "error", errorMsg: `player not found` })
                }
            }).catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))

    } else {
        return res.send({ result: "error", errorMsg: `answer is undefined` })
    }
}
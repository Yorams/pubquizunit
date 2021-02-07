const common = require("../common_functions");

exports.getPageContent = function (req, res) {
    var guidIn = req.params.guid
    var teamData = req.app.get('teamData');
    var appSettings = req.app.get('appSettings');

    common.getTeam(guidIn, teamData, function (currentTeam) {

        return res.render('quiz_main', { data: JSON.stringify(currentTeam), quizTitle: appSettings.quiz.title });
    });
}

exports.submitAnswer = function (req, res) {
    var guidIn = req.body.guid;
    var answer = JSON.parse(req.body.answer);
    var roundIn = req.body.round;
    var questionIn = req.body.question;
    var typeIn = req.body.type;
    var knex = req.app.get('knex');

    if (typeof (answer) !== "undefined" && typeof (typeIn) !== "undefined") {
        // Get team data
        var teamData = req.app.get('teamData');

        // Check if current team exists
        common.getTeam(guidIn, teamData, function (currentTeam) {
            if (currentTeam.success) {
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
                console.log("Cannot get team", ip, currentTeam.errorMessage)
            }
        });
    } else {
        return res.send({ result: "error", errorMsg: `answer is undefined` })
    }
}
const common = require("../common_functions");

const quizData = common.initDatabase('quizunit_data');
const quizAnswers = common.initDatabase('quizunit_answers');



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

    if (typeof (answer) !== "undefined") {
        // Get team data
        var teamData = req.app.get('teamData');

        common.getTeam(guidIn, teamData, function (currentTeam) {
            if (currentTeam.success) {
                // Get current round and question ID from db
                quizData.get("current").then((currentData) => {

                    // Check if answer is from current round & question
                    if (roundIn == currentData.round) {
                        if (questionIn == currentData.question) {
                            // HIER VERDER

                            var dbData = {
                                _id: `${guidIn}:${currentData.round}-${currentData.question}`,
                                round: currentData.round,
                                question: currentData.question,
                                answer: answer
                            }

                            quizAnswers.insert(dbData).then((body) => {
                                return res.send({ result: "success" });
                            }).catch((error) => {
                                return res.send({ result: "error", errorMsg: `Insert schema item: ${error.error} - ${error.reason}` })
                            });
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
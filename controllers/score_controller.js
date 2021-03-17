const common = require("../common_functions");
var path = require('path');
var logger = require('../logger')

// Init logger
var log = logger.app(path.parse(__filename).name);

exports.getPageContent = function (req, res) {
    res.render('score', { username: req.user.username });
}

exports.getTopPageContent = function (req, res) {
    res.render('score_top', { username: req.user.username });
}

exports.getTopVideoPageContent = function (req, res) {
    res.render('score_top_video', { username: req.user.username });
}

exports.getScore = function (req, res) {
    var answersChecked = [];

    var knex = req.app.get('knex');
    var questionTemplates = req.app.get('questionTemplates');

    common.getQuestions(knex).then((questionData) => {

        // Get team data
        knex('teams')
            .then((teamData) => {
                if (typeof (teamData) !== "undefined") {
                    // Team found
                    // Generate empty array. Multidimensional: [Rounds][questions][teams]
                    for (rkey in questionData) {
                        var questions = [];
                        for (qkey in questionData[rkey].questions) {

                            var teams = [];
                            var teamsLookup = {};
                            var tI = 0;
                            for (tKey in teamData) {
                                teams.push({
                                    uuid: teamData[tKey].uuid,
                                    answer: "",
                                    score: 0,
                                    template: questionData[rkey].questions[qkey].template
                                })

                                // Create team lookup table
                                teamsLookup[teamData[tKey].uuid] = {
                                    index: tI,
                                    name: teamData[tKey].name,
                                    totalScore: 0,
                                    roundScore: Array(questionData.length).fill(0)
                                }
                                tI++;
                            }

                            questions[qkey] = teams
                        }

                        answersChecked[rkey] = questions
                    }

                    knex('answers')
                        .then((rows) => {
                            if (rows.length == 0) {
                                // Send empty array if there are no answers
                                return res.send({
                                    teams: teamsLookup,
                                    answers: answersChecked,
                                    questionTemplates: questionTemplates
                                });
                            } else {
                                // Add given answers to answer array
                                for (key in rows) {

                                    try {

                                        // Search for indexes in currentOrder array
                                        var questionIndex;
                                        var roundIndex = common.getCurrentOrder().rounds.findIndex((roundObj) => {
                                            // Find index of question in round
                                            questionIndex = roundObj.questions.findIndex((questionsObj) => {
                                                return questionsObj.uuid === rows[key].question_uuid
                                            })

                                            // return if question is found in round
                                            return questionIndex != -1
                                        })

                                        // Check for orphaned answer from question
                                        if (questionIndex != -1) {

                                            var currTeamUuid = rows[key].team_uuid;
                                            var currTeamAnswer = JSON.parse(rows[key].answer);

                                            var currentQuestion = questionData[roundIndex].questions[questionIndex]

                                            if (typeof (teamsLookup[currTeamUuid]) != "undefined") {
                                                // Ignore message type questions
                                                if (currentQuestion.template != "message") {
                                                    // Check answer and get score
                                                    var score = checkAnswer(currentQuestion, currTeamAnswer);

                                                    // Round score
                                                    score = Math.round((score + Number.EPSILON) * 100) / 100

                                                    // Add score to total
                                                    teamsLookup[currTeamUuid].totalScore = teamsLookup[currTeamUuid].totalScore + score

                                                    // Add score to each round total
                                                    teamsLookup[currTeamUuid].roundScore[roundIndex] = teamsLookup[currTeamUuid].roundScore[roundIndex] + score

                                                    // Add answer, question score and type to team object
                                                    answersChecked[roundIndex][questionIndex][teamsLookup[currTeamUuid].index].answer = currTeamAnswer;
                                                    answersChecked[roundIndex][questionIndex][teamsLookup[currTeamUuid].index].score = score;
                                                }
                                            } else {
                                                log.warning(`Orphaned answer found, corresponding team is not found: ${currTeamUuid}`)
                                            }
                                        } else {
                                            log.warning(`Orphaned answer found, corresponding question is not found: ${rows[key].question_uuid}`)
                                        }

                                    } catch (error) {
                                        log.error("Error:", error)
                                    }

                                }
                                return res.send({
                                    teams: teamsLookup,
                                    answers: answersChecked,
                                    questionTemplates: questionTemplates,
                                });
                            }
                        })

                }

            }).catch((error) => {
                if (error.stack) { log.error(error.stack) }
                ws.send(JSON.stringify({
                    msgType: "error",
                    msg: `team_not_found (${error})`
                }))
            })
    }).catch((error) => { common.errorHandler("Cannot get questions", error, req, res) })
}

function checkAnswer (questionData, teamAnswer) {
    var returnScore = 0;

    // Loop through answer parameters
    for (key in questionData.parameters) {

        var parameterType = questionData.parameters[key].type
        var parameterId = questionData.parameters[key].id
        var correctAnswer = questionData.parameters[key].correct

        var currentTeamAnswer = teamAnswer.find((obj) => {
            return obj.id === parameterId
        }).correct

        switch (parameterType) {
            case "radio":
                returnScore = (currentTeamAnswer[0] == correctAnswer[0]) ? 1 : 0;
                break;

            case "checkbox":
                var totalScore = 0;

                // Loop trough correct answers
                for (key in currentTeamAnswer) {

                    // If an correct answer is found in the team answers, add a point
                    if (correctAnswer.includes(currentTeamAnswer[key])) {
                        totalScore = totalScore + 1;
                    } else {
                        //substract half a point if a incorrect option is given. 
                        totalScore = totalScore - 0.5;
                    }
                }

                // Score cannot be negative.
                if (totalScore / correctAnswer.length < 0) {
                    returnScore = 0
                } else {
                    // Average out all points to a float
                    returnScore = totalScore / correctAnswer.length
                }

                break;

            case "number":
                returnScore = (currentTeamAnswer == correctAnswer) ? 1 : 0;
                break;

            case "text":
                returnScore = similarity(correctAnswer, currentTeamAnswer)
                break;
        }
    }

    return returnScore
}


//functions to check simalarity
function similarity (s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance (s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

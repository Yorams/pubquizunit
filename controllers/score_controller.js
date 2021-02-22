//const common = require("../common_functions");

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
    var questionData = req.app.get('questionData');
    var answersChecked = [];
    var knex = req.app.get('knex');

    // Get team data
    knex('teams')
        .then((teamData) => {
            if (typeof (teamData) !== "undefined") {
                // Team found
                // Generate empty array. Multidimensional: [Rounds][questions][teams]
                for (rkey in questionData.rounds) {
                    var questions = [];
                    for (qkey in questionData.rounds[rkey].vragen) {
                        var teams = [];
                        var teamsLookup = {};
                        var tI = 0;
                        for (tKey in teamData) {

                            teams.push({
                                guid: teamData[tKey].guid,
                                answer: "",
                                score: 0
                            })

                            // Create team lookup table
                            teamsLookup[teamData[tKey].guid] = {
                                index: tI,
                                name: teamData[tKey].name,
                                totalScore: 0,
                                roundScore: Array(questionData.rounds.length).fill(0)
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
                            return res.send({
                                teams: teamsLookup,
                                answers: answersChecked
                            });
                        } else {

                            for (key in rows) {

                                // TODO. Multi vragen worden niet goed geteld.

                                if (typeof (questionData.rounds[rows[key].round].vragen[rows[key].question]) !== "undefined") {
                                    try {
                                        var currGuid = rows[key].guid;
                                        var currRound = rows[key].round;
                                        var currQuestion = rows[key].question;
                                        var currTeamAnswer = JSON.parse(rows[key].answer);

                                        var currRightAnswer = questionData.rounds[currRound].vragen[currQuestion].correct;
                                        var currQuestionType = rows[key].type;

                                        // Check answer and get score
                                        var score = checkAnswer(currQuestionType, currTeamAnswer, currRightAnswer);

                                        // Round score
                                        score = Math.round((score + Number.EPSILON) * 100) / 100

                                        // Add score to total
                                        teamsLookup[currGuid].totalScore = teamsLookup[currGuid].totalScore + score

                                        // Add score to each round total
                                        teamsLookup[currGuid].roundScore[currRound] = teamsLookup[currGuid].roundScore[currRound] + score

                                        // Add answer, question score and type to team object
                                        answersChecked[currRound][currQuestion][teamsLookup[currGuid].index].answer = currTeamAnswer;
                                        answersChecked[currRound][currQuestion][teamsLookup[currGuid].index].type = currQuestionType;
                                        answersChecked[currRound][currQuestion][teamsLookup[currGuid].index].score = score;

                                    } catch (error) {
                                        console.log("Error:", error)
                                    }
                                } else {
                                    console.log(`Error: Score controller: cannot find question with given answer(Round ${rows[key].round}, Question ${rows[key].question}) this occours when questions are edited. Delete all answers to resolve this.`)
                                }
                            }
                            return res.send({
                                teams: teamsLookup,
                                answers: answersChecked
                            });
                        }
                    })
            }

        }).catch((error) => {
            if (error.stack) { console.log(error.stack) }
            ws.send(JSON.stringify({
                msgType: "error",
                msg: `team_not_found (${error})`
            }))
        })
}

function checkAnswer (type, teamAnswer, correctAnswer) {
    var returnScore = 0;
    switch (type) {
        case "one":
            returnScore = (teamAnswer.default == correctAnswer.default) ? 1 : 0;
            break;

        case "multi":
            var totalScore = 0;

            // Loop trough correct answers
            for (key in teamAnswer.default) {

                // If an correct answer is found in the team answers, add a point
                if (correctAnswer.default.includes(teamAnswer.default[key])) {
                    totalScore = totalScore + 1;
                }
            }
            // TODO: substract point if a incorrect option is given. 

            // Average out all points to a float
            returnScore = totalScore / correctAnswer.default.length
            break;


        case "open-numeric":
            // Check is if simmalair
            if (typeof (teamAnswer.default) !== "undefined") {
                returnScore = (correctAnswer.default == teamAnswer.default) ? 1 : 0;
            } else {
                returnScore = 0
            }
            break;


        case "open-text":
            // Compare string to each other, return a score
            if (typeof (teamAnswer.default) !== "undefined") {
                returnScore = similarity(correctAnswer.default, teamAnswer.default)
            } else {
                returnScore = 0
            }
            break;


        case "music":
            // Compare artist and title, return avarage of both
            if (typeof (teamAnswer.artist) !== "undefined") {
                var artistScore = similarity(correctAnswer.artist, teamAnswer.artist)
            } else {
                var artistScore = 0
            }

            if (typeof (teamAnswer.title) !== "undefined") {
                var titleScore = similarity(correctAnswer.title, teamAnswer.title)
            } else {
                var titleScore = 0
            }
            returnScore = (artistScore + titleScore) / 2
            break;


        case "music-locatie":
            // Compare artist and title and location, return avarage of both

            if (typeof (teamAnswer.artist) !== "undefined") {
                var artistScore = similarity(correctAnswer.artist, teamAnswer.artist)
            } else {
                var artistScore = 0
            }

            if (typeof (teamAnswer.title) !== "undefined") {
                var titleScore = similarity(correctAnswer.title, teamAnswer.title)
            } else {
                var titleScore = 0
            }

            var locatieScore = (teamAnswer.locatie == correctAnswer.locatie) ? 1 : 0;

            returnScore = (artistScore + titleScore + locatieScore) / 3
            break;

        case "name-year":
            // Compare name and year, return avarage of both

            if (typeof (teamAnswer.name) !== "undefined") {
                var nameScore = similarity(correctAnswer.name, teamAnswer.name)
            } else {
                var nameScore = 0
            }

            if (typeof (teamAnswer.year) !== "undefined") {
                var yearScore = (correctAnswer.year == teamAnswer.year) ? 1 : 0;
            } else {
                var yearScore = 0
            }

            returnScore = (nameScore + yearScore) / 3
            break;
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

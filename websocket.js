const WebSocket = require('ws');
const common = require("./common_functions");

var countdownTimer;
var teamData;
var questionData;
var knex;

// Broadcast to all clients
var broadcastMsg = function (data, wss) {

    wss.clients.forEach(function each (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

exports.send = broadcastMsg;

exports.parseCommands = function (data, ws, req, app, wss) {
    // Set globals
    knex = app.get('knex');
    teamData = app.get('teamData');
    questionData = app.get('questionData');

    var allowedUsers = ["admin", "user"]

    // If there is no known logged in client, it is probarly a team

    if (data.msgType == "getStatus") {
        /**
         * Returns current question data to team. When they are requesting it.
         */

        // Check if client is admin or user to get the current question.
        if (typeof (req.session.passport) !== "undefined" && typeof (data.guid) === "undefined") {

            // Check if client is an admin.
            knex('users')
                .where({ id: req.session.passport.user })
                .first()
                .then((row) => {

                    // Check if user is allowed
                    if (allowedUsers.includes(row.role)) {
                        // User is allowed
                        data.guid = ""
                        pubQuestionToSingle()
                    }
                })
                .catch((error) => {
                    if (error.stack) { console.log(error.stack) }
                    ws.send(JSON.stringify({
                        msgType: "error",
                        msg: `user_not_found (${error})`
                    }))
                })

        } else {
            if (typeof (data.guid) !== "undefined") {
                // Get team data
                knex('teams')
                    .where({ guid: data.guid })
                    .first()
                    .then((row) => {

                        if (typeof (row) !== "undefined") {
                            // Team found
                            pubQuestionToSingle();
                        }

                    }).catch((error) => {
                        if (error.stack) { console.log(error.stack) }
                        ws.send(JSON.stringify({
                            msgType: "error",
                            msg: `team_not_found (${error})`
                        }))
                    })
            } else {
                ws.send(JSON.stringify({
                    msgType: "error",
                    msg: `invalid_guid`
                }))
            }
        }

        function pubQuestionToSingle () {
            // Get current round and question ID from db
            common.getCurrent(knex).then(currentData => {

                // Check if current round exists in question data
                var currentRound = questionData.rounds[currentData.round];
                if (typeof (currentRound) !== "undefined") {

                    // Check if question exists
                    var currentQuestion = currentRound.vragen[currentData.question];
                    if (typeof (currentQuestion) !== "undefined") {

                        var currQuestionCount = questionData.rounds[parseInt(currentData.round)].vragen.length
                        var roundCount = questionData.rounds.length
                        var answered = false;

                        // Check of vraag al beantwoord is.
                        knex('answers')
                            .where({ guid: data.guid, round: currentData.round, question: currentData.question })
                            .first()
                            .then((row) => {
                                answered = (typeof (row) !== "undefined") ? true : false
                            })
                            .catch((error) => {
                                console.log(`Websocket: cannot get question: ${error.error}: ${error.reason}`)
                            })
                            .finally((e) => {
                                // Send question with stripped answers to client
                                ws.send(JSON.stringify({
                                    msgType: "question",
                                    round: {
                                        name: currentRound.name,
                                        details: currentRound.details,
                                        current: currentData.round,
                                        total: roundCount
                                    },
                                    question: {
                                        name: currentQuestion.name,
                                        type: currentQuestion.type,
                                        answers: currentQuestion.answers,
                                        current: currentData.question,
                                        total: currQuestionCount,
                                        answered: answered
                                    }
                                }));
                            });

                    } else {
                        console.log(`Websocket: cannot get question(${currentData.question})`);
                    }
                } else {
                    console.log(`Websocket: cannot get round(${currentData.round})`);
                }

            }).catch((error) => {
                console.log(`Cannot get current data: ${error}`);
            })
        }

    } else if (data.msgType == "controlQuiz") {
        // Check if client is logged in
        if (typeof (req.session.passport) !== "undefined") {

            knex('users')
                .where({ id: req.session.passport.user })
                .first()
                .then((row) => {

                    // Check if user is allowed to control
                    if (allowedUsers.includes(row.role)) {

                        /**
                         * Controls the the quiz
                         */

                        if (data.action == "next" || data.action == "prev") {

                            // Publish question to players
                            pubQuestionToAll(data.action, wss);

                            // Clear old timers
                            clearTimeout(countdownTimer);

                        } else if (data.action == "countdown") {
                            if (typeof (data.countdownTime) !== "undefined") {
                                var countdownTime = data.countdownTime
                            } else {
                                var countdownTime = 5
                            }

                            // Clear old timers
                            clearTimeout(countdownTimer);

                            broadcastMsg(JSON.stringify({
                                msgType: "countdown",
                                action: "start",
                                seconds: countdownTime
                            }), wss);

                            // Set timer to trigger next question
                            countdownTimer = setTimeout(() => {
                                pubQuestionToAll("next", wss);

                            }, (countdownTime * 1000) + 1000); // Plus 1 sec voor speling

                        } else if (data.action == "countdown_cancel") {

                            clearTimeout(countdownTimer);

                            console.log("Countdown canceled");

                            broadcastMsg(JSON.stringify({
                                msgType: "countdown",
                                action: "cancel"
                            }), wss);

                        }

                    } else {
                        ws.send(JSON.stringify({
                            msgType: "error",
                            msg: "user_not_allowed"
                        }));
                    }
                })
                .catch((error) => {
                    if (error.stack) { console.log(error.stack) }
                    ws.send(JSON.stringify({
                        msgType: "error",
                        msg: `user_not_found (${error})`
                    }))
                })

        } else {
            ws.send(JSON.stringify({
                msgType: "error",
                msg: "not_logged_in"
            }));
        }
    } else {
        ws.send(JSON.stringify({
            msgType: "error",
            msg: "unknown_command"
        }));
    }

}


function pubQuestionToAll (action, wss) {
    // Get current round and question ID from db
    common.getCurrent(knex).then(currentData => {

        var currQuestionCount = questionData.rounds[parseInt(currentData.round)].vragen.length

        var roundCount = questionData.rounds.length

        switch (action) {
            case "next":

                /** 
                 * Next question
                 */

                // Check if end of round is reached
                if (currentData.question < currQuestionCount - 1) {
                    currentData.question = parseInt(currentData.question) + 1
                } else {

                    if (currentData.round < roundCount - 1) {
                        currentData.round = parseInt(currentData.round) + 1
                        currentData.question = 0;
                    } else {
                        console.log("Websocket: End of quiz reached.")
                    }
                }

                break;

            case "prev":
                /**
                 * Previous question
                 */

                // Check if begin of round is reached
                if (currentData.question > 0) {
                    currentData.question = parseInt(currentData.question) - 1
                } else {

                    if (currentData.round > 0) {
                        currentData.round = parseInt(currentData.round) - 1

                        // Aantal vragen van ronde hiervoor
                        var prevRoundQuestionCount = questionData.rounds[parseInt(currentData.round)].vragen.length

                        currentData.question = prevRoundQuestionCount - 1;
                    } else {
                        console.log("Websocket: Begin of quiz reached.")
                    }
                }

                break;
        }

        // Save current round and question to DB
        common.updateCurrent(knex, currentData).then(() => {

            var currentRound = questionData.rounds[currentData.round];
            var currentQuestion = currentRound.vragen[currentData.question];
            var answeredList = [];

            knex('answers')
                .where({ round: currentData.round, question: currentData.question })
                .then((rows) => {
                    // Push all guid of team with an answer to array
                    for (key in rows) {
                        answeredList.push(rows[key].guid);
                    }

                    var sendData = {
                        msgType: "question",
                        round: {
                            name: currentRound.name,
                            details: currentRound.details,
                            current: currentData.round,
                            total: roundCount
                        },
                        question: {
                            name: currentQuestion.name,
                            type: currentQuestion.type,
                            answers: currentQuestion.answers,
                            current: currentData.question,
                            total: currQuestionCount,
                        }
                    }

                    // Send data to all clients
                    wss.clients.forEach(function each (client) {
                        // Check if current client/team has answered
                        sendData.question.answered = answeredList.includes(client.guid)

                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(sendData));
                        }
                    });

                })

        }).catch((error) => {
            console.log(`Websocket: error: cannot update (${error})`);
        });

    });
}
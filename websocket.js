const WebSocket = require('ws');
const common = require("./common_functions");

var countdownTimer;
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

    var allowedUsers = ["admin", "user"]

    // If there is no known logged in client, it is probarly a team

    if (data.msgType == "getStatus") { // Return current question data to team. When they are requesting it.

        // Check if client is admin or user to get the current question.
        if (typeof (req.session.passport) !== "undefined" && typeof (data.uuid) === "undefined") {
            // Check if client is an admin.
            knex('users')
                .where({ id: req.session.passport.user })
                .first()
                .then((row) => {

                    // Check if user is allowed
                    if (allowedUsers.includes(row.role)) {
                        // User is allowed
                        data.uuid = ""
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
            // Client is not a admin, check if it is a valid team member

            if (typeof (data.uuid) !== "undefined") {
                // Get team data
                knex('teams')
                    .where({ uuid: data.uuid })
                    .first()
                    .then((row) => {

                        if (typeof (row) !== "undefined") {
                            // Team found publish question to client
                            pubQuestionToSingle(data.uuid);
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
                    msg: `invalid_uuid`
                }))
            }
        }

        function pubQuestionToSingle (teamUuid = "") {

            // Get current question ID from db
            common.getCurrentQuestion(knex).then(currentQuestionUuid => {

                common.getQuestion(knex, currentQuestionUuid).then((questionData) => {

                    var currQuestionCount = common.getCurrentOrder().rounds.find((obj) => { return obj.uuid === questionData.round }).questionCount
                    var roundCount = common.getCurrentOrder().roundCount
                    var answered = false;

                    // Check of vraag al beantwoord is.
                    knex('answers')
                        .where({ question_uuid: currentQuestionUuid, team_uuid: teamUuid })
                        .first()
                        .then((row) => {
                            answered = (typeof (row) !== "undefined") ? true : false
                        })
                        .catch((error) => { common.errorHandler("Cannot get answer", error) })
                        .finally((e) => {
                            // Send question with stripped answers to client
                            ws.send(JSON.stringify({
                                msgType: "question",
                                round: {
                                    name: questionData.round_name,
                                    details: questionData.round_details,
                                    currentNr: questionData.round_order,
                                    total: roundCount
                                },
                                question: {
                                    uuid: questionData.uuid,
                                    name: questionData.name,
                                    type: questionData.type,
                                    parameters: questionData.parameters,
                                    currentNr: questionData.order,
                                    total: currQuestionCount,
                                    answered: answered
                                }
                            }));
                        });

                }).catch((error) => { common.errorHandler("Cannot get question", error) })

            }).catch((error) => { common.errorHandler("Cannot get current data", error) })
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
                         * Control the quiz
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
    // Get current question ID from db
    common.getCurrentQuestion(knex).then(currentQuestionUuid => {

        // Search for indexes in currentOrder array
        var questionIndex;
        var roundIndex = common.getCurrentOrder().rounds.findIndex((roundObj) => {
            // Find index of question in round
            questionIndex = roundObj.questions.findIndex((questionsObj) => {
                return questionsObj.uuid === currentQuestionUuid
            })

            // return if question is found in round
            return questionIndex != -1
        })

        var currQuestionCount = common.getCurrentOrder().rounds[roundIndex].questionCount
        var roundCount = common.getCurrentOrder().roundCount

        switch (action) {
            case "next":

                // Check if end of round is reached
                if (questionIndex < currQuestionCount - 1) {
                    questionIndex = parseInt(questionIndex) + 1
                } else {

                    if (roundIndex < roundCount - 1) {
                        roundIndex = parseInt(roundIndex) + 1
                        questionIndex = 0;
                    } else {
                        console.log("Websocket: End of quiz reached.")
                    }
                }

                break;

            case "prev":

                // Check if begin of round is reached
                if (questionIndex > 0) {
                    questionIndex = parseInt(questionIndex) - 1
                } else {

                    if (roundIndex > 0) {
                        roundIndex = parseInt(roundIndex) - 1

                        // Aantal vragen van ronde hiervoor
                        var prevRoundQuestionCount = common.getCurrentOrder().rounds[parseInt(roundIndex)].questions.length

                        questionIndex = prevRoundQuestionCount - 1;
                    } else {
                        console.log("Websocket: Begin of quiz reached.")
                    }
                }

                break;
        }

        // Get new question uuid
        var newQuestionUuid = common.getCurrentOrder().rounds[roundIndex].questions[questionIndex].uuid

        // Save current round and question to DB
        knex('current_question')
            .where({ name: 'current' })
            .update({ question: newQuestionUuid })
            .then(() => {

                // Get question data
                common.getQuestion(knex, newQuestionUuid).then((questionData) => {
                    var answeredList = [];

                    knex('answers')
                        .where({ question_uuid: newQuestionUuid })
                        .then((rows) => {
                            // Push all uuid of team with an answer to array
                            for (key in rows) {
                                answeredList.push(rows[key].team_uuid);
                            }

                            var sendData = {
                                msgType: "question",
                                round: {
                                    name: questionData.round_name,
                                    details: questionData.round_details,
                                    currentNr: questionData.round_order,
                                    total: roundCount
                                },
                                question: {
                                    uuid: questionData.uuid,
                                    name: questionData.name,
                                    type: questionData.type,
                                    parameters: questionData.parameters,
                                    currentNr: questionData.order,
                                    total: currQuestionCount,
                                }
                            }

                            // Send data to all clients
                            wss.clients.forEach(function each (client) {
                                // Check if current client/team has answered
                                sendData.question.answered = answeredList.includes(client.uuid)

                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify(sendData));
                                }
                            });
                        })
                })

            }).catch((error) => { common.errorHandler("Websocket: error: cannot update current", error) })

    });
}
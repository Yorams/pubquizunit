const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const common = require("./common_functions");

// Get settings
common.getJsonFile("/settings")
    .then(function (appSettings) {

        // Get Quiz teams
        common.getJsonFile("/teams")
            .then(function (teamData) {

                // Get Quiz questions
                common.getJsonFile("/questions")
                    .then(function (questionData) {

                        const server = https.createServer({
                            cert: fs.readFileSync(appSettings.certificate.cert),
                            key: fs.readFileSync(appSettings.certificate.key)
                        });

                        const quizData = common.initDatabase('quizunit_data');
                        const quizAnswers = common.initDatabase('quizunit_answers');

                        // Init websocket
                        const wss = new WebSocket.Server({ server });

                        var countdownTimer;

                        // Websocket handler
                        wss.on('connection', function connection (ws, req) {
                            // Websocket client connected
                            const ip = req.connection.remoteAddress;
                            console.log("Websocket: Client connected.", ip)

                            // On message from websocket client
                            ws.on('message', function incoming (data) {
                                // Check parsed Data
                                var parsedData;
                                try {
                                    parsedData = JSON.parse(data);
                                } catch (e) {
                                    console.log("Websocket: incoming parse error:", e)
                                }

                                if (typeof (parsedData) !== "undefined") {
                                    parseCommands(parsedData, ws, req);
                                }
                            });
                        });

                        server.listen(appSettings.app.websocketPort);
                        function parseCommands (data, ws, req) {
                            const ip = req.connection.remoteAddress;

                            if (data.msgType == "getStatus") {

                                // Get team data
                                common.getTeam(data.guid, teamData, function (currentTeam) {
                                    if (currentTeam.success) {
                                        // Get current round and question ID from db
                                        quizData.get("current").then((currentData) => {

                                            // Check if current round exists in all questions
                                            var currentRound = questionData.rounds[currentData.round];
                                            if (typeof (currentRound) !== "undefined") {

                                                // Check if question exists
                                                var currentQuestion = currentRound.vragen[currentData.question];
                                                if (typeof (currentQuestion) !== "undefined") {

                                                    var currQuestionCount = questionData.rounds[parseInt(currentData.round)].vragen.length
                                                    var roundCount = questionData.rounds.length
                                                    var answered = false;

                                                    // Check of vraag al beantwoord is.
                                                    quizAnswers.get(`${data.guid}:${currentData.round}-${currentData.question}`).then((body) => {
                                                        // Vraag is beantwoord
                                                        answered = true;
                                                    }).catch((error) => {
                                                        // Vraag is niet beantwoord
                                                        if (error.error == "not_found") {
                                                            answered = false;
                                                        } else {
                                                            console.log(`Websocket: Onbekende error: ${error.error}: ${error.reason}`)
                                                        }

                                                    }).finally((e) => {
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
                                    } else {
                                        console.log("Cannot get team", ip, currentTeam.errorMessage)
                                    }
                                });
                            } else if (data.msgType == "controlQuiz") {
                                if (data.action == "next" || data.action == "prev") {
                                    // Get team data to check if it is a admin
                                    common.getTeam(data.guid, teamData, function (currentTeam) {
                                        if (currentTeam.success) {
                                            // Check is user is admin
                                            if (currentTeam.team.name == "Admin") {

                                                // Publish question to players
                                                publishQuestion(data.action);

                                                // Clear old timers
                                                clearTimeout(countdownTimer);

                                            } else {
                                                ws.send("He boef, hier kan je niks vinden.")
                                            }
                                        }
                                    });

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
                                    }));

                                    // Set timer to trigger next question
                                    countdownTimer = setTimeout(() => {
                                        publishQuestion("next");

                                    }, (countdownTime * 1000) + 1000); // Plus 1 sec voor speling

                                } else if (data.action == "countdown_cancel") {

                                    clearTimeout(countdownTimer);

                                    console.log("Countdown canceled");

                                    broadcastMsg(JSON.stringify({
                                        msgType: "countdown",
                                        action: "cancel"
                                    }));

                                }
                            } else {
                                console.log("Unknown command", ip, data);
                            }

                        }

                        // Broadcast to all clients
                        var broadcastMsg = function (data) {
                            wss.clients.forEach(function each (client) {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(data);
                                }
                            });
                        }

                        exports.send = broadcastMsg;

                        function publishQuestion (action) {
                            // Get current round and question ID from db
                            quizData.get("current").then((currentData) => {

                                var currQuestionCount = questionData.rounds[parseInt(currentData.round)].vragen.length

                                var roundCount = questionData.rounds.length

                                switch (action) {
                                    case "next":

                                        // Next     question
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
                                        // Previous question
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

                                // Save to DB
                                quizData.insert(currentData).then((body) => {
                                    //console.log(currentData.round, currentData.question)

                                    var currentRound = questionData.rounds[currentData.round];
                                    var currentQuestion = currentRound.vragen[currentData.question];
                                    var answeredTotal = [];

                                    quizAnswers.list(function (err, body) {
                                        if (!err) {

                                            body.rows.forEach(function (doc) {
                                                var docId = doc.id.split(":");
                                                var guid = docId[0];

                                                var answerR = docId[1].split("-")[0];
                                                var answerD = docId[1].split("-")[1];

                                                if (answerR == currentData.round && answerD == currentData.question) {
                                                    answeredTotal.push(guid);
                                                }

                                            });

                                        }

                                        // Send broadcast to players
                                        broadcastMsg(JSON.stringify({
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
                                                answeredTotal: answeredTotal
                                            }
                                        }));
                                    });

                                }).catch((error) => {
                                    console.log(`Websocket: error: cannot update document (${error.error} - ${error.reason})`);
                                });

                            });
                        }
                    })
                    .catch((err) => { console.log(`websocket: cannot load questions file (${err})`) })

            })
            .catch((err) => { console.log(`websocket: cannot load teams file (${err})`) })

    })
    .catch((err) => { console.log(`websocket: cannot load settings file (${err})`) })





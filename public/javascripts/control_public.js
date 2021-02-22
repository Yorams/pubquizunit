// -- WEBSOCKET --
var socket = new ReconnectingWebSocket(`wss://${window.location.hostname}`);

socket.onerror = function (m) {
    console.log(m)
}
socket.onopen = function (m) {
    console.log("websocket Connected");
    socket.send(JSON.stringify({
        msgType: "getStatus",
    }));
}

socket.onmessage = function (m) {
    recvData = JSON.parse(m.data);
    if (recvData.msgType == "question") {
        loadQuestion(recvData);
    } else if (recvData.msgType == "countdown") {
        countdown(recvData.seconds, recvData.action);
    }
}

jQuery(function () {
    // quiz controls
    $(".controlBtn").on("click", function () {

        var currentAction = $(this).data("action");

        socket.send(JSON.stringify({
            msgType: "controlQuiz",
            action: currentAction,
            countdownTime: parseInt($(".countdownTimeInput").val())
        }));
    })
});

function loadQuestion (data) {
    clearInterval(countdownTimer);
    $(".subTitle").html(data.round.name);

    $(".currentRound").html(`Ronde ${data.round.current} van ${data.round.total}`)
    $(".currentQuestion").html(`Vraag ${data.question.current} van ${data.question.total}`)

    $(".currentQuestion").html(` Ronde ${data.round.current + 1}/${data.round.total} | Vraag ${data.question.current + 1}/${data.question.total}`)

    var questionContent = {};
    if (data.question.type == "one") {
        questionContent = qOneTemplate(data.question);
    } else if (data.question.type == "multi") {
        questionContent = qMultiTemplate(data.question);
    } else if (data.question.type == "open-numeric") {
        questionContent = qOpenNumericTemplate(data.question);
    } else if (data.question.type == "open-text") {
        questionContent = qOpenTextTemplate(data.question);
    } else if (data.question.type == "music") {
        questionContent = qMusicTemplate(data.question);
    } else if (data.question.type == "music-locatie") {
        data.question["locaties"] = locaties;
        questionContent = qMusicLocatieTemplate(data.question);
    } else if (data.question.type == "intro") {
        questionContent = introTemplate(data.question);
    } else if (data.question.type == "name-year") {
        questionContent = qNameYearTemplate(data.question);
    }

    $(".questionMain").html(questionContent);
}

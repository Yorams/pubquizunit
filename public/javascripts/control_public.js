var questionTemplate = Handlebars.compile($('#questionTemplate').html());
var radioTemplate = Handlebars.compile($('#radioTemplate').html());
var checkboxTemplate = Handlebars.compile($('#checkboxTemplate').html());
var textTemplate = Handlebars.compile($('#textTemplate').html());
var numberTemplate = Handlebars.compile($('#numberTemplate').html());

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
    } else if (recvData.msgType == "error") {

        if (recvData.msg == "not_logged_in") {
            showError("You are logged out.", "Please login again")
            location.reload();
        }
    }
}

jQuery(function () {
    // quiz controls
    $(".controlBtn").on("click", function () {

        var currentAction = $(this).data("action");
        console.log(currentAction)

        socket.send(JSON.stringify({
            msgType: "controlQuiz",
            action: currentAction,
            countdownTime: parseInt($(".countdownTimeInput").val())
        }));
    })
});

function loadQuestion (data) {
    // Clear countdown timer
    clearInterval(countdownTimer);

    $(".subTitle").html(data.round.name)

    $(".currentQuestion").html(` Ronde ${data.round.currentNr + 1}/${data.round.total} | Vraag ${data.question.currentNr + 1}/${data.question.total}`)

    data.question["isDisabled"] = (true) ? "disabled" : "";

    var parametersOutput = "";
    for (key in data.question.parameters) {
        var currParameter = data.question.parameters[key]

        switch (currParameter.type) {
            case "radio":
                parametersOutput = `${parametersOutput}${radioTemplate({ id: key, data: currParameter })}`
                break;
            case "checkbox":
                parametersOutput = `${parametersOutput}${checkboxTemplate({ id: key, data: currParameter })}`
                break;
            case "text":
                parametersOutput = `${parametersOutput}${textTemplate({ id: key, data: currParameter })}`
                break;
            case "number":
                parametersOutput = `${parametersOutput}${numberTemplate({ id: key, data: currParameter })}`
                break;
        }
    }
    $(".questionMain").html(questionTemplate({ round: data.round, content: data.question, parameters: parametersOutput }))

}
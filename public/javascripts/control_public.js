var questionTemplate = Handlebars.compile($('#questionTemplate').html());
var radioTemplate = Handlebars.compile($('#radioTemplate').html());
var checkboxTemplate = Handlebars.compile($('#checkboxTemplate').html());
var textTemplate = Handlebars.compile($('#textTemplate').html());
var numberTemplate = Handlebars.compile($('#numberTemplate').html());
var messageTemplate = Handlebars.compile($('#messageTemplate').html());
var roundTemplate = Handlebars.compile($('#roundTemplate').html());

Handlebars.registerHelper("inc", function (value, add) {
    if (typeof (add) !== "undefined") {
        return parseInt(value) + 1 + add;
    } else {
        return parseInt(value) + 1;
    }
});

Handlebars.registerHelper("debug", function (value) {
    console.log(value)
});

Handlebars.registerHelper("getTemplateName", function (templateId) {
    var currentTemplate = questionTemplates.find((obj) => {
        return obj.id === templateId
    })
    return currentTemplate.name
});

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

        } else if (recvData.msg == "invalid_uuid") {
            showError("You are logged out.", "Please login again")
            location.reload();

        } else if (recvData.msg == "current_question_does_not_exsists") {
            showError("Question does not exists", "Add a question to continue.")
        }
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
    getQuestionData();
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
            case "message":
                parametersOutput = `${parametersOutput}${messageTemplate({ id: key, data: currParameter })}`
                break;
        }
    }
    $(".questionMain").html(questionTemplate({ round: data.round, content: data.question, parameters: parametersOutput }))

    // Hide submit button if question is a message
    if (data.question.template == "message") {
        $(".submitAnswerBtn").hide()
    } else {
        $(".submitAnswerBtn").show()
    }

    // Make current question active in overview
    $(`.questionOverviewMain`).removeClass("active");

    var questionElement = $(`.questionOverviewMain[data-question-uuid="${data.question.uuid}"]`)
    questionElement.addClass("active");

    // Scroll to question in overview
    var childPos = questionElement.offset();
    var parentPos = questionElement.parent().parent().parent().offset();

    var childTopOffset = childPos.top - parentPos.top;

    $(".controlQuestionsMain").scrollTop(childTopOffset);
}

function getQuestionData (callback = () => { }) {
    sendPost("/questions/get_questions", function (data) {
        questionTemplates = data.questionTemplates

        if (data.questions.length != 0) {

            // Show rounds with questions
            $(".roundsMain").html(roundTemplate(data));

        } else {
            $(".roundsMain").html(alertTemplate("No rounds found, add a round to continue."))

        }
        callback();
    })
}
var questionTemplate = Handlebars.compile($('#questionTemplate').html());
var radioTemplate = Handlebars.compile($('#radioTemplate').html());
var checkboxTemplate = Handlebars.compile($('#checkboxTemplate').html());
var textTemplate = Handlebars.compile($('#textTemplate').html());
var numberTemplate = Handlebars.compile($('#numberTemplate').html());
var messageTemplate = Handlebars.compile($('#messageTemplate').html());
var alertTemplate = Handlebars.compile($('#alertTemplate').html());


jQuery(function () {

    if (!glob_data.success) {
        $(".questionMain").html("<h1 class='text-center my-5'>Geen of onjuist ID</h3>");
    } else {

        // -- WEBSOCKET --
        var socket = new ReconnectingWebSocket(`wss://${window.location.hostname}?uuid=${glob_data.uuid}`);

        socket.onerror = function (m) {
            console.log(m)
        }
        socket.onopen = function (m) {
            console.log("websocket Connected");
            socket.send(JSON.stringify({
                msgType: "getStatus",
                uuid: glob_data.uuid
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
    }

    // Submit answer
    $(".questionMain").on("click", ".submitAnswerBtn", function (e) {

        if ($("form.answers")[0].reportValidity()) {
            $(".submitAnswerBtn").prop('disabled', true);
            var parameters = [];

            // Loop over option input parameters
            $(".optionInputMain").each(function () {
                var correctOptions = []

                var optionElementId = $(this).data("id")

                // Each option input item
                $(this).find(".optionInput input").each(function () {
                    // Input type is a option, check if it is checked.
                    if ($(this).is(':checked')) {
                        // Get the correct value from the text input
                        correctOptions.push($(this).val())
                    }
                })
                parameters.push({ id: optionElementId, correct: correctOptions })
            })

            // Loop over other type parameters
            $(".textInput, .numberInput").each(function () {
                parameters.push({ id: $(this).data("id"), correct: $(this).val() })
            })

            var sendData = {
                teamUuid: glob_data.uuid,
                answer: JSON.stringify(parameters),
                questionUuid: glob_data.questionUuid,
            }

            $.post("submitanswer", sendData, function (data) {
                if (data.result == "success") {
                    $(".answersInput").prop('disabled', true);
                    $(".questionMain").append(alertTemplate({ alertType: "success", alertMessage: "Je antwoord is opgeslagen" }));
                } else if (data.result == "error") {
                    $(".answersInput").prop('disabled', false);
                    $(".questionMain").append(alertTemplate({ alertType: "danger", alertMessage: "Er ging iets fout, vernieuw evt de pagina. Meer info in de console" }));
                    console.log(data.errorMsg);
                }
            }).fail(function (xhr, status, error) {
                $(".questionMain").append(alertTemplate({ alertType: "danger", alertMessage: `Er ging iets fout, contact de quizmaster (${error})` }));
            })

        }
    });

    $(".questionMain").on("submit", ".answers", function (e) {
        e.preventDefault();
    })
});

function loadQuestion (data) {
    // Clear countdown timer
    clearInterval(countdownTimer);
    glob_data.quizLive = data.quizLive;
    glob_data.questionUuid = data.question.uuid

    if (data.quizLive) {
        $(".quizContainer").addClass("show");
        $(".messageContainer").removeClass("show");
    } else {
        $(".quizContainer").removeClass("show");
        $(".messageContainer").addClass("show");
    }
    var welcomeModalState = (!data.quizLive) ? "show" : "hide"
    $(".welcomeModal").modal(welcomeModalState)

    $(".headerSubTitle").html(`Team: ${glob_data.name}`);
    $(".subTitle").html(data.round.name)

    $(".currentQuestion").html(` Ronde ${data.round.currentNr + 1}/${data.round.total} | Vraag ${data.question.currentNr + 1}/${data.question.total}`)

    data.question["isDisabled"] = (data.question.answered) ? "disabled" : "";

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

    // Show the question
    $(".questionMain").html(questionTemplate({ round: data.round, content: data.question, parameters: parametersOutput }))

    // Show message if answer is already given
    if (data.question.answered) {
        $(".questionMain").append(alertTemplate({ alertType: "warning", alertMessage: "Je hebt deze vraag al beantwoord" }));
    }

    // Hide submit button if question is a message
    if (data.question.template == "message") {
        $(".submitAnswerBtn").hide()
    } else {
        $(".submitAnswerBtn").show()
    }
}
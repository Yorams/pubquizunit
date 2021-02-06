var glob_currStatus;


// -- WEBSOCKET --
var socket = new ReconnectingWebSocket('wss://' + window.location.hostname + ':8080');

socket.onerror = function (m) {
    console.log(m)
}
socket.onopen = function (m) {
    console.log("websocket Connected");
    socket.send(JSON.stringify({
        msgType: "getStatus",
        guid: glob_data.team.guid
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
    if (!glob_data.success){
        $(".questionMain").html("<h1 class='text-center my-5'>Geen of onjuist ID</h3>");
    }

    // Submit answer
    $(".questionMain").on("click", ".submitAnswerBtn", function (e) {
        
        if ($("form.answers")[0].reportValidity()){
            $(".submitAnswerBtn").prop('disabled', true);
            var answer;

            switch (glob_currStatus.question.type) {
                case "one":
                    answer = {"default":$("input[name=\"answer\"]:checked").val()};
                    break;
                case "multi":
                    // Get all checked boxes
                    var checked = [];
                    $("input[name=\"answer\"]:checked").each(function(){
                        checked.push($(this).val());
                    })
                    answer = { "default": checked };
                    break;
                case "open-numeric":
                    answer = { "default": parseInt($("input[name=\"answer\"]").val()) };
                    break;
                case "open-text":
                    answer = { "default": $("input[name=\"answer\"]").val() };
                    break;
                case "music":
                    answer = {
                        "artist": $("input[name=\"artist\"]").val(),
                        "title": $("input[name=\"title\"]").val()
                    };
                    break;
                case "music-locatie":
                    answer = {
                        "artist": $("input[name=\"artist\"]").val(),
                        "title": $("input[name=\"title\"]").val(),
                        "locatie": $("input[name=\"locatie\"]:checked").val()
                    };
                    break;
                case "name-year":
                    answer = {
                        "name": $("input[name=\"name\"]").val(),
                        "year": $("input[name=\"year\"]").val()
                    };
            }
            
            var sendData = {
                guid: glob_data.team.guid,
                answer: JSON.stringify(answer),
                round: glob_currStatus.round.current,
                question: glob_currStatus.question.current,
            }

            $.post("submitanswer", sendData, function(data){
                if (data.result == "success"){
                    $(".answersInput").prop('disabled', true);
                    $(".questionMain").append(qAlertTemplate({ alertType: "success", alertMessage: "Je antwoord is opgeslagen" }));
                } else if (data.result == "error") {
                    $(".answersInput").prop('disabled', false);
                    $(".questionMain").append(qAlertTemplate({ alertType: "danger", alertMessage: "Er ging iets fout, vernieuw evt de pagina. Meer info in de console" }));
                    console.log(data.errorMsg);
                }
            }).fail(function (xhr, status, error){
                $(".questionMain").append(qAlertTemplate({ alertType: "danger", alertMessage: `Er ging iets fout, contact de quizmaster (${error})` }));
            })
        }
    });

    $(".questionMain").on("submit", ".answers", function(e){
        e.preventDefault();
    })
});

function loadQuestion(data){
    // Clear countdown timer
    clearInterval(countdownTimer);

    glob_currStatus = data;
    $(".headerSubTitle").html(`Team: ${glob_data.team.name}`);
    $(".subTitle").html(data.round.name)

    $(".currentQuestion").html(` Ronde ${data.round.current+1}/${data.round.total} | Vraag ${data.question.current+1}/${data.question.total}`)
    

    // Check if question already answered
    // Dit heeft 2 bronnen, als een pagina opnieuw laad kan er per client een lookup worden gedaan in de db of de vraag al beantwoord is.
    // Met een broadcast websocket msg kan dit niet, daarom word dan de volledige lijst meegestuurd met spelers die de desbetreffende vraag al beantwoord hebben.
    if (typeof (data.question.answeredTotal) != "undefined"){
        for (i in data.question.answeredTotal){
            data.question.answered = (data.question.answeredTotal[i] == glob_data.team.guid)
            break;
        }
    }

    data.question["isDisabled"] = (data.question.answered) ? "disabled" : ""  ;

    var questionContent = {};
    if(data.question.type == "one"){
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
    if (data.question.answered) {
        $(".questionMain").append(qAlertTemplate({ alertType: "warning", alertMessage: "Je hebt deze vraag al beantwoord" }));
    }
}

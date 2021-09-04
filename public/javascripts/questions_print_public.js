var roundTemplate = Handlebars.compile($('#roundTemplate').html());
var editorTemplate = Handlebars.compile($('#editorTemplate').html());
var radioTemplate = Handlebars.compile($('#radioTemplate').html());
var checkboxTemplate = Handlebars.compile($('#checkboxTemplate').html());
var textTemplate = Handlebars.compile($('#textTemplate').html());
var numberTemplate = Handlebars.compile($('#numberTemplate').html());
var messageTemplate = Handlebars.compile($('#messageTemplate').html());
var alertTemplate = Handlebars.compile($('#alertTemplate').html());

var mainQuestionData;
var questionTemplates;

/**
 * Handlebars helpers
 */

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

Handlebars.registerHelper("checkedIf", function (answer, correct) {
    if (typeof (correct) !== "undefined") {
        return (correct.includes(answer)) ? "checked" : "";
    }
});

Handlebars.registerHelper("getTemplateName", function (templateId) {
    var currentTemplate = questionTemplates.find((obj) => {
        return obj.id === templateId
    })
    return currentTemplate.name
});

Handlebars.registerHelper("getQuestionContent", function (roundUuid, questionUuid) {
    return openInEditor(roundUuid, questionUuid);
});

/**
 * Main initialization
 */

getQuestionData()

/**
 * Events
 */

$(".roundsMain").on("click", ".noAction", function (e) {
    e.stopPropagation();
});

// Click on question/open in editor
$(".roundsMain").on("click", ".questionMain", function (e) {
    var roundUuid = $(this).parent().parent().data("round-uuid")
    var questionUuid = $(this).data("question-uuid")

    openInEditor(roundUuid, questionUuid);
})

// Delete option
$(".questionEditorMain").on("click", ".delOptionBtn", function (e) {
    e.preventDefault();
    optionEdit("del", this)
})

// Add option
$(".questionEditorMain").on("click", ".addOptionBtn", function (e) {
    e.preventDefault();
    optionEdit("add", this)
})

// Submit question form
$(".questionEditorMain").on("submit", ".questionForm", function (e) {
    e.preventDefault();

    var roundUuid = $(this).closest(".questionMain").data("round-uuid");
    var questionUuid = $(this).closest(".questionMain").data("question-uuid");
    var templateId = $(this).closest(".questionMain").data("template");

    if (templateId == "round") {
        // Save round
        saveRound(roundUuid, () => {
            getQuestionData(() => {
                openInEditor(roundUuid);
            });
        })
    } else {
        // Save question
        saveQuestion(roundUuid, questionUuid, () => {
            getQuestionData(() => {
                openInEditor(roundUuid, questionUuid);
            });
        })
    }
})

// Changes in inputs enables save button
$(".questionEditorMain").on("input", ".editorInput, .optionInput, .optionName", function (e) {
    $(".editorSaveBtn").prop('disabled', false);

    window.onbeforeunload = function (e) {
        var dialogText = "The question is not saved, are you sure you wat to quit?";
        e.returnValue = dialogText;
        return dialogText;
    };
})

/** 
 * Local functions
 */
function getQuestionData (callback = () => { }) {
    sendPost("get_questions", function (data) {
        mainQuestionData = data.questions;
        questionTemplates = data.questionTemplates

        if (data.questions.length != 0) {

            // Show rounds with questions
            $(".roundsMain").html(roundTemplate(data));

            // Make questions sortable
            $(".roundContent").sortable({
                //group: "questionGroup",
                animation: 150,
                onUpdate: function (evt) {
                    // Dragged item
                    var itemEl = evt.item
                    var roundUuid = $(itemEl).closest(".roundMain").data("round-uuid");

                    updateOrder(roundUuid);
                },
            });
        } else {
            $(".roundsMain").html(alertTemplate("No rounds found, add a round to continue."))

        }
        callback();
    })
}

function updateOrder (roundUuid) {
    // Create list with uuid's of questions
    var orderList = [];
    $(`#list-${roundUuid}`).children().each(function (index) {
        orderList.push({ order: index, uuid: $(this).data("question-uuid") })
    })

    // Save order if dragging is done
    var sendData = {
        itemType: "save_order",
        roundUuid: roundUuid,
        order: JSON.stringify(orderList)
    }
    sendPost("edit_item", sendData, function (data) {
        if (data.result == "success") {
            getQuestionData();
        } else if (data.result == "error") {
            showError("Something is going wrong.", "Cannot save the order, try again or contact the system admin")
        }
    })
}

function openInEditor (roundUuid, questionUuid) {
    var output = "";

    // Get round
    currentRound = mainQuestionData.find(function (obj) {
        return obj.uuid == roundUuid
    })

    if (typeof (questionUuid) === "undefined") { // Open round

        // Set template name
        currentRound.template = "round"

        // Make selected round active
        $(`.roundMain[data-round-uuid="${roundUuid}"]`).addClass("active")

        // Show in editor
        output += editorTemplate({ round: currentRound, content: currentRound })

    } else { // Open question

        // Make selected question active
        $(`.questionMain[data-question-uuid="${questionUuid}"]`).addClass("active")

        // Get question
        currentQuestion = currentRound.questions.find(function (obj) {
            return obj.uuid == questionUuid
        })

        var parametersOutput = "";
        for (key in currentQuestion.parameters) {
            var currParameter = currentQuestion.parameters[key]

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

        output += editorTemplate({ round: currentRound, content: currentQuestion, parameters: parametersOutput })
    }

    return output
}
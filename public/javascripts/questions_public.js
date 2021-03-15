var roundTemplate = Handlebars.compile($('#roundTemplate').html());
var editorTemplate = Handlebars.compile($('#editorTemplate').html());
var radioTemplate = Handlebars.compile($('#radioTemplate').html());
var checkboxTemplate = Handlebars.compile($('#checkboxTemplate').html());
var textTemplate = Handlebars.compile($('#textTemplate').html());
var numberTemplate = Handlebars.compile($('#numberTemplate').html());
var messageTemplate = Handlebars.compile($('#messageTemplate').html());

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

// Add round button
$(".addRoundBtn").on("click", function (e) {
    // Add round on server
    sendPost("edit_item", { itemType: "add_round" }, function (data) {
        if (data.result == "success") {
            getQuestionData(() => {
                openInEditor(data.roundUuid);
            });
        }
    })
})

// Edit round
$(".roundsMain").on("click", ".roundName", function (e) {
    var roundUuid = $(this).parent().parent().data("round-uuid")
    openInEditor(roundUuid);

});

// Delete round
$(".roundsMain").on("click", ".delRoundBtn", function (e) {
    var roundUuid = $(this).parent().parent().parent().data("round-uuid")

    confirmModal("Are you sure you want to delete this round and all corresponding questions? <br>This will also delete any corresponding answers from the teams.", () => {
        var sendData = {
            itemType: "del_round",
            roundUuid: roundUuid,
        }

        sendPost("edit_item", sendData, function (data) {
            if (data.result == "success") {
                getQuestionData();
            }
        })
    })
});

// Add question button
$(".roundsMain").on("click", ".addQuestionBtn", function (e) {

    var sendData = {
        itemType: "add_question",
        roundUuid: $(this).parent().data("round-uuid"),
        questionTemplate: $(this).data("template")
    }

    sendPost("edit_item", sendData, function (data) {
        if (data.result == "success") {
            getQuestionData(() => {
                openInEditor(sendData.roundUuid, data.questionUuid);
            });
        } else if (data.result == "error") {
            showError("Something is going wrong.", "Cannot add the question, try again or contact the system admin")
        }
    })
})

// Delete question button
$(".roundsMain").on("click", ".delQuestionBtn", function (e) {
    confirmModal("Are you sure you want to delete this questions? <br>This will also delete any corresponding answers from the teams.", () => {
        var sendData = {
            itemType: "del_question",
            questionUuid: $(this).data("question-uuid")
        }
        sendPost("edit_item", sendData, function (data) {
            if (data.result == "success") {
                getQuestionData();

                // Empty the editor
                $(".questionEditorMain").html("");

            } else if (data.result == "error") {
                showError("Something is going wrong.", "Cannot delete the question, try again or contact the system admin")
            }
        })
    })
});

// Duplicate question button
$(".roundsMain").on("click", ".dupQuestionBtn", function (e) {
    var sendData = {
        itemType: "dup_question",
        roundUuid: $(this).closest(".roundMain").data("round-uuid"),
        questionUuid: $(this).data("question-uuid")
    }
    sendPost("edit_item", sendData, function (data) {
        if (data.result == "success") {
            getQuestionData(() => {
                openInEditor(sendData.roundUuid, data.questionUuid);
            });
        } else if (data.result == "error") {
            showError("Something is going wrong.", "Cannot duplicate the question, try again or contact the system admin")
        }
    })
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
            },
        });
        callback();
    })
}

function openInEditor (roundUuid, questionUuid) {
    // Reset active states
    $(".questionMain").removeClass("active")
    $(".roundMain").removeClass("active")

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
        $(".questionEditorMain").html(editorTemplate({ round: currentRound, content: currentRound }))

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

        $(".questionEditorMain").html(editorTemplate({ round: currentRound, content: currentQuestion, parameters: parametersOutput }))
    }

    // Focus on quetion name
    $(".questionNameInput").focus();
}

function optionEdit (action, currentElement) {
    var roundUuid = $(currentElement).closest(".questionMain").data("round-uuid");
    var questionUuid = $(currentElement).closest(".questionMain").data("question-uuid");

    var sendData = {
        itemType: "add_option",
        roundUuid: roundUuid,
        questionUuid: questionUuid,
        parameterId: $(currentElement).closest(".form-group").data("id")
    }

    if (action == "add") {
        sendData.itemType = "add_option"
    } else if (action == "del") {
        sendData.itemType = "del_option";
        sendData.parameterContentId = $(currentElement).data("id");
    }

    saveQuestion(roundUuid, questionUuid, () => {
        sendPost("edit_item", sendData, function (data) {
            if (data.result == "success") {
                getQuestionData(() => {
                    openInEditor(roundUuid, questionUuid);

                    window.onbeforeunload = false;
                });
            } else if (data.result == "error") {
                showError("Something is going wrong.", "Cannot save the options, try again or contact the system admin")
            }
        })
    })
}

function saveQuestion (roundUuid, questionUuid, callback = () => { }) {
    var parameters = [];

    // Loop over option input parameters
    $(".optionInputMain").each(function () {
        var optionElements = []
        var correctOptions = []

        var optionElementId = $(this).data("id")

        // Each option input item
        $(this).find(".optionInput input").each(function () {

            if ($(this).hasClass("optionName")) {
                // Input type is text/the option name
                optionElements.push($(this).val())

            } else if ($(this).hasClass("optionCorrect")) {
                // Input type is a option, check if it is checked.
                if ($(this).is(':checked')) {
                    // Get the correct value from the text input
                    correctOptions.push($(this).siblings("label").find(".optionName").val())
                }
            }
        })
        parameters.push({ id: optionElementId, content: optionElements, correct: correctOptions })
    })

    // Loop over other type parameters
    $(".textInput, .numberInput").each(function () {
        parameters.push({ id: $(this).data("id"), correct: $(this).val() })
    })

    // Loop over message type parameters
    $(".messageInput").each(function () {
        parameters.push({ id: $(this).data("id"), content: $(this).val() })
    })

    // Compose data to send
    var sendData = {
        itemType: "save_question",
        roundUuid: roundUuid,
        questionUuid: questionUuid,
        questionName: $(".questionNameInput").val(),
        parameters: JSON.stringify(parameters)
    }

    sendPost("edit_item", sendData, function (data) {
        if (data.result == "success") {
            callback();
            window.onbeforeunload = false;
        } else if (data.result == "error") {
            showError("Something is going wrong.", "Cannot save the question, try again or contact the system admin")
        }
    })
}

function saveRound (roundUuid, callback = () => { }) {
    // Compose data to send
    var sendData = {
        itemType: "save_round",
        roundUuid: roundUuid,
        roundName: $(".questionNameInput").val(),
    }

    sendPost("edit_item", sendData, function (data) {
        if (data.result == "success") {
            callback();
            window.onbeforeunload = false;
        } else if (data.result == "error") {
            showError("Something is going wrong.", "Cannot save the round, try again or contact the system admin")
        }
    })
}
function confirmModal (message, action) {
    // Empty error message
    $(".confirmModal .errorMsg").html("");
    $(".confirmMessage").html(message);

    // Bind yes button to action
    $(".btnConfirmYes").off('click').on("click", function () {
        action();
        $(".confirmModal").modal("hide")
    })

    // Show the modal
    $(".confirmModal").modal("show")

    // Set focus to yes button
    $('.btnConfirmYes').focus();
}
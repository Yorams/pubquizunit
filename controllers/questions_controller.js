const common = require("../common_functions");
var _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

var mainQuestionData = [];

exports.getPageContent = function (req, res) {
    res.render('questions', { username: req.user.username });
}

exports.editItem = function (req, res) {
    var knex = req.app.get('knex');
    var itemType = req.body.itemType;

    if (itemType == "add_round") {
        // Add a round

        var roundData = {
            uuid: uuidv4(),
            name: "New round",
            details: "Vragen over nog een ronde",
        }

        // Save to database
        knex('rounds')
            .insert(roundData)
            .then(() => res.send({ result: "success", roundUuid: roundData.uuid }))
            .catch((error) => { common.errorHandler("Cannot create round", error, req, res) })

    } else if (itemType == "save_round") {
        var roundUuid = req.body.roundUuid;
        var roundName = req.body.roundName;

        // Save
        knex('rounds')
            .where({ uuid: roundUuid })
            .update({ name: roundName })
            .then(() => res.send({ result: "success" }))
            .catch((error) => { common.errorHandler("Cannot update round", error, req, res) })

    } else if (itemType == "del_round") {
        var roundUuid = req.body.roundUuid;
        // Delete corresponding questions
        knex('questions')
            .where({ round: roundUuid })
            .del()
            .then(() => {

                // Delete round
                knex('rounds')
                    .where({ uuid: roundUuid })
                    .del()
                    .then(() => res.send({ result: "success" }))
                    .catch((error) => { common.errorHandler("Cannot delete round", error, req, res) })
            })
            .catch((error) => { common.errorHandler("Cannot delete questions", error, req, res) })

    } else if (itemType == "add_question") {
        // Add a question

        var questionTemplates = req.app.get('questionTemplates');

        // Get id's from request    
        var roundUuid = req.body.roundUuid;
        var questionTemplateId = req.body.questionTemplate;

        // Get template from question templates file
        var currentTemplate = questionTemplates.find(function (obj) {
            return obj.id === questionTemplateId
        })

        for (key in currentTemplate.parameters) {

            var currParameter = currentTemplate.parameters[key]

            // Add one entry for radio or checkbox input fields
            if (currParameter.type == "radio" || currParameter.type == "checkbox") {
                currentTemplate.parameters[key].content = ["Option 1", "Option 2"]
            }
        }

        var questionData = {
            uuid: uuidv4(),
            name: "",
            template: questionTemplateId,
            parameters: JSON.stringify(currentTemplate.parameters),
            round: roundUuid,
            edited_by: req.user.id
        }

        // Save to database
        knex('questions')
            .insert(questionData)
            .then(() => res.send({ result: "success", questionUuid: questionData.uuid }))
            .catch((error) => { common.errorHandler("Cannot create questions", error, req, res) })

    } else if (itemType == "dup_question") {
        var questionUuid = req.body.questionUuid;

        // Get current question.
        knex('questions')
            .where({ uuid: questionUuid })
            .first()
            .then((currQuestion) => {

                // Overwrite some parameters
                currQuestion.id = null
                currQuestion.uuid = uuidv4()
                currQuestion.edited_by = req.user.id;

                // Save to database
                knex('questions')
                    .insert(currQuestion)
                    .then(() => res.send({ result: "success", questionUuid: currQuestion.uuid }))
                    .catch((error) => { common.errorHandler("Cannot duplicate questions", error, req, res) })


            })
            .catch((error) => { common.errorHandler("Cannot get question", error, req, res) })

    } else if (itemType == "del_question") {
        var questionUuid = req.body.questionUuid;
        // Get parameters from question
        knex('questions')
            .where({ uuid: questionUuid })
            .del()
            .then(() => res.send({ result: "success" }))
            .catch((error) => { common.errorHandler("Cannot get question", error, req, res) })

    } else if (itemType == "add_option" || itemType == "del_option") {

        var roundUuid = req.body.roundUuid;
        var questionUuid = req.body.questionUuid;
        var parameterId = req.body.parameterId;

        // Get parameters from question
        knex('questions')
            .where({ uuid: questionUuid })
            .first()
            .then((question) => {
                // Decode JSON
                var parameters = JSON.parse(question.parameters)

                // Get index of parameter with id
                var currParameterIndex = parameters.findIndex(function (obj) {
                    return obj.id === parameterId
                })

                if (itemType == "add_option") {
                    // Add option
                    parameters[currParameterIndex].content.push("New option");
                } else if (itemType == "del_option") {
                    // Delete option
                    var parameterContentId = req.body.parameterContentId;
                    parameters[currParameterIndex].content.splice(parameterContentId, 1);
                }

                // Save
                knex('questions')
                    .where({ uuid: questionUuid })
                    .update({ parameters: JSON.stringify(parameters) })
                    .then(() => res.send({ result: "success" }))
                    .catch((error) => { common.errorHandler("Cannot update question", error, req, res) })


            })
            .catch((error) => { common.errorHandler("Cannot get question", error, req, res) })

    } else if (itemType == "save_question") {
        var roundUuid = req.body.roundUuid;
        var questionUuid = req.body.questionUuid;
        var questionName = req.body.questionName;
        try {
            var parametersIn = JSON.parse(req.body.parameters);
        } catch (error) {
            console.log(error)
        }

        // Get parameters from question
        knex('questions')
            .where({ uuid: questionUuid })
            .first()
            .then((question) => {
                // Decode JSON
                var parameters = JSON.parse(question.parameters)

                // Add other stuff to parameters
                for (key in parameters) {
                    parametersIn[key].name = parameters[key].name
                    parametersIn[key].type = parameters[key].type
                }

                // Save
                knex('questions')
                    .where({ uuid: questionUuid })
                    .update({ name: questionName, parameters: JSON.stringify(parametersIn) })
                    .then(() => res.send({ result: "success" }))
                    .catch((error) => { common.errorHandler("Cannot update question", error, req, res) })

            })
            .catch((error) => { common.errorHandler("Cannot get question", error, req, res) })
    } else if (itemType == "save_order") {
        var roundUuid = req.body.roundUuid;
        var order = JSON.parse(req.body.order);

        return knex.transaction(trx => {
            const queries = [];
            order.forEach(orderItem => {
                const query = knex('questions')
                    .where('uuid', orderItem.uuid)
                    .update({
                        order: orderItem.order,
                    })
                    .transacting(trx); // This makes every update be in the same transaction
                queries.push(query);
            });

            // Once every query is written
            Promise.all(queries)
                .then(() => {
                    // We try to execute all of them
                    trx.commit();
                    res.send({ result: "success" })
                })
                .catch(() => {
                    // And rollback in case any of them goes wrong
                    trx.rollback();
                    res.send({ result: "error" })
                });
        });



    } else {
        common.errorHandler("Unknown command", `${itemType}`, req, res)
    }
}

exports.getQuestions = function (req, res) {
    var knex = req.app.get('knex');
    var questionTemplates = req.app.get('questionTemplates');

    knex('rounds')
        .then((rounds) => {
            knex('questions')
                .orderBy('order', 'asc')
                .then((questions) => {

                    // Parse parameters
                    for (qKey in questions) {
                        try {
                            var parsedParameters = JSON.parse(questions[qKey].parameters)
                        } catch (error) {
                            console.log(error)
                        }
                        questions[qKey].parameters = parsedParameters

                    }

                    // Group by round
                    var grouped = _.groupBy(questions, function (obj) {
                        return obj.round;
                    });

                    // Add questions to rounds
                    for (rKey in rounds) {
                        if (typeof (grouped[rounds[rKey].uuid]) !== "undefined") {
                            rounds[rKey].questions = grouped[rounds[rKey].uuid]
                        }
                    }

                    res.send({ questionTemplates: questionTemplates, questions: rounds });

                })
                .catch((error) => { common.errorHandler("Cannot get questions", error, req, res) })

        })
        .catch((error) => { common.errorHandler("Cannot get rounds", error, req, res) })
}

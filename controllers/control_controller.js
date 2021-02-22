const common = require("../common_functions");

exports.getPageContent = function (req, res) {

    return res.render('control', { username: req.user.username });

}

exports.getQuestions = function (req, res) {
    common.getQuestions(function (questionData) {
        return res.send(questionData);
    })
}
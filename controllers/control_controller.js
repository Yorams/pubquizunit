const common = require("../common_functions");

exports.getPageContent = function (req, res) {

    var guidIn = "3b8795dc-c4ed-4201-9b76-ab2a36ceb988";

    var teamData = req.app.get('teamData');

    common.getTeam(guidIn, teamData, function (currentTeam) {
        return res.render('control', { username: req.user.username, data: JSON.stringify(currentTeam) });
    });
}

exports.getQuestions = function (req, res) {
    common.getQuestions(function (questionData) {
        return res.send(questionData);
    })
}
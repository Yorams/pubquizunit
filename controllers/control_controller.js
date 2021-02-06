const common = require("../common_functions");
//
exports.getPageContent = function (req, res) {
    var passwordIn = req.params.password
    var password = "ditisechtheelgeheimditmagniemandweten";
    var guidIn = "3b8795dc-c4ed-4201-9b76-ab2a36ceb988";

    var teamData = req.app.get('teamData');

    common.getTeam(guidIn, teamData, function (currentTeam) {
        if (passwordIn === password) {
            return res.render('control', { password: password, data: JSON.stringify(currentTeam) });
        } else {
            return res.send("He boef, wegwezen hier.")
        }
    });
}

exports.getQuestions = function (req, res) {
    common.getQuestions(function (questionData) {
        return res.send(questionData);
    })
}
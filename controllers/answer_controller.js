const common = require("../common_functions");

exports.getPageContent = function (req, res) {
    var passwordIn = req.params.password
    var password = "ditisechtheelgeheimditmagniemandweten";
    var guidIn = "d994f50a-fc23-4085-8083-31600736cf2a";

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

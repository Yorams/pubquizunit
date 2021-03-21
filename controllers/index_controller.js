const common = require("../common_functions");

exports.getPageContent = function (req, res) {
    res.render('index', { username: req.user.username });
}


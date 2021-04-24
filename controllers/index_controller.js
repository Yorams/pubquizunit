const common = require("../common_functions");

exports.getPageContent = function (req, res) {
    if (req.isAuthenticated()) {
        res.render('index', { username: req.user.username });
    } else {
        res.render('index_public');
    }

}


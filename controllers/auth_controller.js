const common = require("../common_functions");
const passport = require('passport');

exports.getPageContent = function (req, res) {
    res.render('login');
}

exports.login = function (req, res, next) {

    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }

        if (!user) {
            console.log(info)
            return res.send(JSON.stringify({
                status: "failed",
                message: info.message
            }));
        }

        req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.send(JSON.stringify({
                status: "success",
            }));
        });
    })(req, res, next);
}

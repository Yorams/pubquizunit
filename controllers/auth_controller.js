const common = require("../common_functions");
const passport = require('passport');
var crypto = require('crypto');
const { resolve } = require("path");

exports.getPageContent = function (req, res) {
    res.render('login');
}

exports.getUserListContent = function (req, res) {
    res.render('user_list', { username: req.user.username });
}

exports.getUserList = function (req, res) {
    var knex = req.app.get('knex');
    knex('users')
        .select('id', 'username', 'role')
        .then((rows) => res.send({ result: "success", data: rows }))
        .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get users: ${error}` }))
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

exports.editUser = function (req, res) {
    var knex = req.app.get('knex');
    var id = req.body.id;
    var username = req.body.username;
    var password = req.body.password;

    var passValidation = validatePassword(password);
    var salt = crypto.randomBytes(20).toString('hex');

    var dbData = { username: username }

    if (typeof (username) !== "undefined") {

        // Check if user exists
        knex('users')
            .where({ username: username })
            .first()
            .then((row) => {
                if (typeof (row) === "undefined") {
                    // Username doesn't exist

                    // Checks if there's an id given. Then add or update the user
                    if (typeof (id) === "undefined" || id == "") {
                        // Add user

                        if (passValidation.valid) {
                            // Password is valid, set password variable.
                            dbData.password = common.hashPassword(password, salt);
                            dbData.salt = salt;
                            dbData.role = "user"

                            // Save to database
                            knex('users')
                                .insert(dbData)
                                .then(() => res.send({ result: "success" }))
                                .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot create user: ${error}` }))

                        } else {
                            res.send({ result: "error", errorCode: "password_unvalid", errorMsg: `${passValidation.msg}` })
                        }

                    } else {
                        // Edit user

                        // Do not set password if it is empty
                        if (typeof (input) !== "undefined" || input != "") {
                            if (passValidation.valid) {
                                dbData.password = common.hashPassword(password, salt);
                                dbData.salt = salt;
                            } else {
                                res.send({ result: "error", errorCode: "password_unvalid", errorMsg: `${passValidation.msg}` })
                            }
                        }

                        knex('users')
                            .where({ id: id })
                            .update(dbData)
                            .then(() => res.send({ result: "success" }))
                            .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot create user: ${error}` }))

                    }
                } else {
                    res.send({ result: "error", errorCode: "username_taken", errorMsg: `Username taken` })
                }

            })
            .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get user: ${error}` }))

    } else {
        res.send({ result: "error", errorCode: "username_empty", errorMsg: `Username is empty` })
    }
};

exports.deleteUser = function (req, res) {
    var knex = req.app.get('knex');
    var id = req.body.id;

    // Check if user is not admin.
    knex('users')
        .where({ id: id })
        .first()
        .then((row) => {
            if (row.role == "admin") {
                res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot delete admin` })
            } else if (req.user.id == id) {
                res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot delete yourself` })
            } else {
                knex('users')
                    .where({ id: id })
                    .del()
                    .then(() => res.send({ result: "success" }))
                    .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot delete user: ${error}` }))
            }
        })
        .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get user: ${error}` }))
};

function validatePassword (input) {
    var returnData = {}
    if (typeof (input) !== "undefined" || input != "") {
        if (input.length > 6) {
            returnData.valid = true;
        } else {
            returnData.valid = false;
            returnData.msg = "Password is to short";
        }
    } else {
        returnData.valid = false;
        returnData.msg = "Password is empty";
    }
    return returnData
}
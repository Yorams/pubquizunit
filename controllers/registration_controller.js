const common = require("../common_functions");
var validator = require('validator');
const { v4: uuidv4 } = require('uuid');

exports.getPageContent = function (req, res) {
    res.render('registration');
}

exports.edit = function (req, res) {
    var knex = req.app.get('knex');

    var teamname = req.body.teamname;
    var email = req.body.email;
    //var tel = req.body.tel;

    let unvalidProp = [];

    // Validate input
    let inputError = {
        teamname: (teamname.length > 2) && (teamname.length < 255),
        email: validator.isEmail(email),
        //tel: validator.isMobilePhone(tel, 'nl-NL'),
    }

    for (key in inputError) {
        if (!inputError[key]) {
            unvalidProp.push(key)
        }
    }

    var dbData = {
        name: teamname,
        email: email,
        status: "inactive"
        //tel: tel
    }

    // Handle possible errors
    if (unvalidProp.length != 0) {
        res.send({ result: "error", errorCode: "input_invalid", errorMsg: unvalidProp })
    } else {
        // No errors, continue

        // Check if team name exists
        knex('teams')
            .where({ name: teamname }).orWhere({ email: email })
            .then((rows) => {
                console.log(rows)
                //if (typeof (rows) === "undefined") {
                if (rows.length == 0) {
                    // name doesn't exist
                    // Add team

                    // Generate uuid
                    dbData.uuid = uuidv4();

                    // Save to database
                    knex('teams')
                        .insert(dbData)
                        .then(() => res.send({ result: "success" }))
                        .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot create team: ${error}` }))

                } else {
                    let takenProp = [];

                    // There is existing data.
                    for (key in rows) {

                        if (rows[key].name == teamname) {
                            takenProp.push("teamname");
                        }

                        if (rows[key].email == email) {
                            takenProp.push("email");
                        }

                    }
                    if (takenProp.length > 0) {
                        res.send({ result: "error", errorCode: "item_exists", errorMsg: takenProp })
                    } else {
                        res.send({ result: "error", errorCode: "generic", errorMsg: `Existing data found but no matching properties` })
                    }
                }
            })
            .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))
    }

};
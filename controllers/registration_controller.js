const common = require("../common_functions");
const mailer = require('../mailer');
var validator = require('validator');
var path = require('path');
const { v4: uuidv4 } = require('uuid');
var logger = require('../logger');
require('dotenv').config();

// Init logger
var log = logger.app(path.parse(__filename).name);

exports.getPageContent = function (req, res) {
    var appSettings = req.app.get('appSettings');
    res.render('registration', { recaptcha: appSettings.recaptcha });
}

exports.edit = function (req, res) {
    var knex = req.app.get('knex');
    var appSettings = req.app.get('appSettings');
    var recaptcha = req.app.get('recaptcha');

    var teamname = req.body.teamname;
    var email = req.body.email;
    var recaptchaToken = req.body.recaptchaToken;
    //var tel = req.body.tel;

    // Build assesment request
    const request = ({
        assessment: {
            event: {
                token: recaptchaToken,
                siteKey: appSettings.recaptcha.apiKey,
            },
        },
        parent: recaptcha.projectPath,
    });

    recaptcha.client.createAssessment(request).then((response) => {
        response = response[0]
        //console.log(response)

        // Check if the token is valid
        if (!response.tokenProperties.valid) {
            log.error("The CreateAssessment call failed because the token was: " + response.tokenProperties.invalidReason);
            return res.send({ result: "error", errorCode: "generic", errorMsg: `invalid token` });
        }

        // Check if the expected action was executed.
        if (response.tokenProperties.action === "registration") {

            // Get the risk score and the reason(s).
            if (response.riskAnalysis.score > appSettings.recaptcha.threshold) {
                // Recaptha is valid, proceed.

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
                    return res.send({ result: "error", errorCode: "input_invalid", errorMsg: unvalidProp })
                } else {
                    // No errors, continue

                    // Check if team name exists
                    knex('teams')
                        .where({ name: teamname }).orWhere({ email: email })
                        .then((rows) => {

                            if (rows.length == 0) {
                                // name doesn't exist
                                // Add team

                                // Generate uuid
                                dbData.uuid = uuidv4();

                                // Save to database
                                knex('teams')
                                    .insert(dbData)
                                    .then(() => {
                                        // Prepare template
                                        mailer.parseTemplate("registration_confirm", {
                                            "registration_link": new URL(`quiz/${dbData.uuid}`, appSettings.app.baseUrl)
                                        }).then((html) => {

                                            // Send mail
                                            mailer.sendMail(appSettings.email, email, {
                                                subject: "Registratie is voltooid: Dit is je link naar de quiz",
                                                text: `Bedankt voor het registreren, klik hier om mee te doen aan de quiz: ${new URL(`quiz/${dbData.uuid}`, appSettings.app.baseUrl)}`,
                                                html: html,
                                            }).then((info => {
                                                log.info(`Created user and send mail ${dbData.uuid}`);
                                                return res.send({ result: "success" })
                                            })).catch((error) => {
                                                return res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot send email` })
                                            })

                                        }).catch((error) => {
                                            return res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot parse template` })
                                        })

                                    })
                                    .catch((error) => {
                                        log.error(`Cannot create team ${error}`);
                                        return res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot create team: ${error}` })
                                    })
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
                                    return res.send({ result: "error", errorCode: "item_exists", errorMsg: takenProp })
                                } else {
                                    return res.send({ result: "error", errorCode: "generic", errorMsg: `Existing data found but no matching properties` })
                                }
                            }
                        })
                        .catch((error) => {
                            log.error(`Cannot get team ${error}`);
                            return res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` })
                        })
                }
            } else {
                log.error("Probably a bot found");
                return res.send({ result: "error", errorCode: "invalid_recaptcha", errorMsg: `You're a bot...` });
            }
        } else {
            log.error("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
            return res.send({ result: "error", errorCode: "generic", errorMsg: `Recaptcha error with tag` });
        }
    }).catch((error) => {
        log.error(`iets recaptcha error: ${error.stack}`);
        return res.send({ result: "error", errorCode: "generic", errorMsg: `iets recaptcha error` })
    })
};
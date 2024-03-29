const { v4: uuidv4 } = require('uuid');

exports.getPageContent = function (req, res) {
    res.render('teams', { username: req.user.username });
}

exports.getList = function (req, res) {
    var knex = req.app.get('knex');
    knex('teams')
        .select('id', 'name', 'email', 'uuid', "lastseen", "status")
        .then((rows) => res.send({ result: "success", data: rows }))
        .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get teams: ${error}` }))
}

exports.edit = function (req, res) {
    var knex = req.app.get('knex');
    var id = req.body.id;
    var name = req.body.name;

    var dbData = { name: name }

    if (typeof (name) !== "undefined") {

        // Check if team exists
        knex('teams')
            .where({ name: name })
            .first()
            .then((row) => {

                // Ok, a bit hacky but it works. 
                //This here is to check if the team is editing itself. If so, it is allowed to edit the password.
                var isSameTeam = false
                if (typeof (row) !== "undefined") {
                    isSameTeam = id == row.id
                }

                if (typeof (row) === "undefined" || isSameTeam) {
                    // name doesn't exist

                    // Checks if there's an id given. Then add or update the team
                    if (typeof (id) === "undefined" || id == "") {
                        // Add team

                        // Generate uuid
                        dbData.uuid = uuidv4();

                        // Save to database
                        knex('teams')
                            .insert(dbData)
                            .then(() => res.send({ result: "success" }))
                            .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot create team: ${error}` }))

                    } else {
                        // Edit team

                        knex('teams')
                            .where({ id: id })
                            .update(dbData)
                            .then(() => res.send({ result: "success" }))
                            .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot edit team: ${error}` }))

                    }
                } else {
                    res.send({ result: "error", errorCode: "name_taken", errorMsg: `name taken` })
                }

            })
            .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))

    } else {
        res.send({ result: "error", errorCode: "name_empty", errorMsg: `name is empty` })
    }
};

exports.delete = function (req, res) {
    var knex = req.app.get('knex');
    var id = req.body.id;

    // Check if team is not admin.
    knex('teams')
        .where({ id: id })
        .first()
        .then((teamData) => {
            knex('teams')
                .where({ id: id })
                .del()
                .then(() => {

                    // Also delete corresponding answers
                    knex("answers")
                        .where({ team_uuid: teamData.uuid })
                        .del()
                        .then(() => {
                            res.send({ result: "success" })
                        })
                        .catch((error) => { common.errorHandler("Cannot delete corresponding answers", error, req, res) })

                })
                .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot delete team: ${error}` }))

        })
        .catch((error) => res.send({ result: "error", errorCode: "generic", errorMsg: `Cannot get team: ${error}` }))
};
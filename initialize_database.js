// Get settings
const common = require("./common_functions");
module.exports = common.getJsonFile("/settings").then(function (appSettings) {

    // init database
    const knex = require('knex')(appSettings.database);

    // Run migrations
    knex.migrate.latest()
        .then(() => {
            return knex.seed.run();
        })
        .then(() => {
            return console.log("Database is initialized")
        })
        .finally(() => {
            process.exit()
        })
})
    .catch((err) => {
        if (err.message.includes("ENOENT") && err.message.includes("settings")) {
            log.error(`Cannot load settings file: settings.json. You have to rename settings_empty.json to settings.json and alter the settings in de file.`)
        } else {
            log.error(err.stack)
        }
    })
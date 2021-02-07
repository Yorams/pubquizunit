var fs = require('fs');
const { resolve } = require('path');
var path = require('path');

exports.getJsonFile = function (fileName) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path.join(__dirname, fileName + ".json"), 'utf8', function (err, contents) {
            if (err) return reject(err);
            resolve(JSON.parse(contents));
        });
    })
}

exports.saveJson = function (fileName, data, callback) {
    fs.writeFile(path.join(__dirname, fileName + ".json"), JSON.stringify(data), function (err) {
        if (err) return console.log(err);
        callback();
    });
}

exports.getTeam = function (guidIn, teamData, callback) {
    var returnData = {};

    if (typeof (guidIn) === "undefined") {
        returnData["success"] = false;
        returnData["errorMessage"] = "guid not given";
        callback(returnData);
    } else {
        //// Check guid //// 

        // Find team in data
        var currentTeam = teamData.find(function (obj) {
            return obj.guid === guidIn;
        })

        // Check if guid is found
        if (typeof (currentTeam) !== "undefined") {
            returnData["success"] = true;
            returnData["team"] = currentTeam;

        } else {
            returnData["success"] = false;
            returnData["errorMessage"] = "guid not found";
        }
        callback(returnData);
    }
}

exports.getCurrent = function (knex) {
    return new Promise(function (resolve, reject) {
        return knex('current_question')
            .where({ name: 'current' })
            .then(rows => { resolve(rows[0]) })
            .catch(error => reject(error))
    })
}

exports.updateCurrent = function (knex, data) {
    return new Promise(function (resolve, reject) {
        return knex('current_question')
            .where({ name: 'current' })
            .update({ round: data.round, question: data.question })
            .then(resolve())
            .catch(error => reject(error))
    })
}
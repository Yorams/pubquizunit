var fs = require('fs');
var path = require('path');

exports.getJson = function (fileName, callback) {
    fs.readFile(path.join(__dirname, fileName + ".json"), 'utf8', function (err, contents) {
        if (err) return console.log(err);
        callback(JSON.parse(contents))
    });
}

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

exports.initDatabase = function (database) {
    const nano = require('nano')('http://admin:N5gcxKzAMqZhrURhbCcP@localhost:5984');
    return nano.db.use(database);
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

exports.getQuestions = function (callback) {
    const dbData = exports.initDatabase('quizunit_data');

    // Get from DB
    dbData.get("vragen").then((body) => {

        callback(body);

    }).catch((error) => {
        console.log(`Cannot get questions: ${error}`);
    })
}
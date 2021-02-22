var scoreBoard = Handlebars.compile($('#scoreBoard').html());

Handlebars.registerHelper('debug', function (data) {
    console.log(data);
})

Handlebars.registerHelper('getRoundScore', function (data, key) {
    var returnData = 0;
    if (typeof (data[key]) !== "undefined") {
        returnData = Math.round((data[key] + Number.EPSILON) * 100) / 100
    }

    return returnData;
})

// Formateer antwoorden voor de popover
Handlebars.registerHelper('formatAnswer', function (data, type) {
    var returnData = "";
    if (type == "one" || type == "multi" || type == "open-numeric" || type == "open-text") {
        returnData = data.default
    } else if (type == "music") {
        returnData = `<b>Artiest:</b> ${data.artist}<br> <b>Titel:</b> ${data.title}`
    } else if (type == "music-locatie") {
        returnData = `<b>Artiest:</b> ${data.artist}<br> <b>Titel:</b> ${data.title}<br> <b>Locatie:</b> ${data.locatie}`
    }
    return returnData
})

Handlebars.registerHelper('showScore', function (data) {
    if (typeof (data) !== "undefined") {
        return data;
    } else {
        return 0
    }
})

Handlebars.registerHelper("inc", function (value, add) {
    if (typeof (add) !== "undefined") {
        return parseInt(value) + 1 + add;
    } else {
        return parseInt(value) + 1;
    }
});

Handlebars.registerHelper('round', function (score) {
    return Math.round((score + Number.EPSILON) * 100) / 100
})

Handlebars.registerHelper('topStyle', function (place) {
    var returnData = "";
    if (place == 0) {
        returnData = "topFirst"
    } else if (place == 1) {
        returnData = "topSecond"
    } else if (place == 2) {
        returnData = "topThird"
    }
    return returnData;
})

var tooltipSettings = {
    placement: 'right',
    container: 'body',
    html: true,
    selector: '.scoreNumber',
}

var refreshTimer;


jQuery(function () {
    $(".scoreMain").on("mouseover", ".scoreNumber", function () {
        $(".scoreNumber").popover('hide')
        $(this).popover('show')
    })

    // Toggle auto refresh
    $(".btnAutoRefresh").on("click", function () {
        // Toggle icon and class
        $(this).find("button").toggleClass("btn-success")
        $(this).find("i").toggleClass("mdi-power-on")

        $(this).find("button").toggleClass("btn-danger")
        $(this).find("i").toggleClass("mdi-power-off")

        // Start of cancel timer
        if ($(this).find("i").hasClass("mdi-power-on")) {
            loadScore("overview");
            startRefreshTimer()
        } else {
            clearInterval(refreshTimer);
        }
    })
})


function startRefreshTimer () {
    /*refreshTimer = setInterval(function () {
        loadScore("overview");
    }, 5000)*/
}

function loadScore (view) {
    sendPost("getScore", function (data) {
        if (view == "overview") {
            $(".scoreMain").html(scoreBoard(data));
            $(".scoreNumber").popover('hide')

            clearInterval(refreshTimer);
            startRefreshTimer();

            // Mark score green if answer is given
            $(".scoreNumber").each(function () {
                var answerContent = $(this).data("content")

                if (answerContent != "") {
                    if (typeof (answerContent) !== "undefined") {
                        $(this).addClass("hasAnswer");
                    }
                }
            })

        } else if (view == "top") {
            var scoreViewBtn = Handlebars.compile($('#scoreViewBtn').html());

            // Append score view buttons for every round
            $(".scoreViewMain").append(scoreViewBtn(data.answers));

            var teamsArray = [];
            // Convert to array of objects
            for (key in data.teams) {
                var currTeam = data.teams[key];
                currTeam["guid"] = key
                teamsArray.push(currTeam);
            }

            // Sort top score
            var sortedScore = teamsArray.sort(function (a, b) {
                return b.totalScore - a.totalScore
            })
            // Split first 3
            var scoreStage = [sortedScore[0], sortedScore[1], sortedScore[2]]
            var scoreOthers = sortedScore.splice(3, sortedScore.length);

            $(".scoreMain").html(scoreBoard({ scoreStage: scoreStage, scoreOthers: scoreOthers }));
        }
    })
}

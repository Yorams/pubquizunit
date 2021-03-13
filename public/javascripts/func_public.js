var errorTemplate = Handlebars.compile($('#errorTemplate').html());



function sendPost (url, parameterA, parameterB) {
    if (typeof (parameterA) === "function") {
        callback = parameterA
        sendData = null
    } else if (typeof (parameterA) === "object") {
        callback = parameterB
        sendData = parameterA
    }

    $.post(url, sendData, function (data) {
        if (data.result == "error" && data.errorCode == "logged_out") {
            showError("You are logged out.", "You will be redirected to the login page")
            window.location.href = "/login"
        } else {
            callback(data);
        }
    })
}

function showError (title, message) {

    // Generate random id
    var alertId = Math.floor(Math.random() * 10000000);

    // Add alert to container
    $(".errorContainer").append(errorTemplate({ title: title, message: message, id: alertId }))

    // Set options and show
    $(`.alert-${alertId}`).toast({ delay: 5000 })
    $(`.alert-${alertId}`).toast("show");

    // Remove element after it is done
    $(`.alert-${alertId}`).on("hidden.bs.toast", function () {
        $(`.alert-${alertId}`).remove();
    })
}


var countdownTimer;
var countdownTime = 0;

function countdown (sec, action) {
    clearInterval(countdownTimer);
    countdownTime = 0;

    // Start countdown
    if (action == "start") {
        countdownTime = sec;
        countdownStartTime = sec;

        // Show timer
        $(".countdownMain").collapse("show");
        $(".countdownTime").html(countdownTime);

        // Update time
        countdownTimer = setInterval(() => {
            countdownTime = countdownTime - 1

            if (countdownTime < 0) {
                // Countdown voorbij
                $(".answersInput").prop('disabled', true);
                clearInterval(countdownTimer);
            } else {
                // Bereken percentage voor background in div
                var currPercent = (100 / countdownStartTime) * countdownTime
                $(".countdownMain").css("background", `linear-gradient(90deg,#f5d3a1 ${currPercent}%,  #fff ${currPercent}%)`);

                // Plaats tijd in element
                $(".countdownTime").html(countdownTime);
            }
        }, 1000);
    } else if (action == "cancel") {
        clearInterval(countdownTimer);
        $(".countdownMain").collapse("hide");
    }
}
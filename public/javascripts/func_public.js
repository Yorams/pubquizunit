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

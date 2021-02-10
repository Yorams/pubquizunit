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
            window.location.href = "/login"
        } else {
            callback(data);
        }
    })
}
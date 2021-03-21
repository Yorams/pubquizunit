var baseUrl = window.location.href;


$(".loginForm").on("submit", function (e) {
    e.preventDefault();
    e.stopPropagation()

    // Reset error messages
    $(".loginErrorMsg").html("");

    var sendData = {
        username: $("input[name='username']").val(),
        password: $("input[name='password']").val()
    }

    $.post("/login", sendData, function (rawData) {
        responseData = JSON.parse(rawData);

        $(".userInput").removeClass("is-valid")
        $(".userInput").removeClass("is-invalid")

        if (responseData.status == "success") {
            $(".userInput").addClass("is-valid");

            // Redirect to previous page
            var searchParams = new URLSearchParams(window.location.search);
            var referral = searchParams.get("r")

            if (referral === null) {
                referral = "/control"
            }

            window.location.href = referral

        } else if (responseData.status == "failed") {
            $(".loginErrorMsg").html(responseData.message)
            $(".userInput").addClass("is-invalid")

        }
    }).fail((error) => {
        if (error.status == 429) {
            $(".loginErrorMsg").html(error.responseText)
            $(".userInput").addClass("is-invalid")
        }
    })
})

var baseUrl = window.location.href;


$(".loginForm").on("submit", function (e) {
    e.preventDefault();
    e.stopPropagation()

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
            window.location.href = "/control"

        } else if (responseData.status == "failed") {
            $(".loginErrorMsg").html(responseData.message)
            $(".userInput").addClass("is-invalid")

        }
        console.log(responseData);
    })
})

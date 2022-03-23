$(".main-form").on("submit", function (e) {
    e.preventDefault()
    e.stopPropagation()

    if ($(this)[0].checkValidity() === false) {
        console.log("fout")
    } else {

        let sendData = {
            teamname: $(".main-form input[name='teamname']").val(),
            email: $(".main-form input[name='email']").val(),
            tel: $(".main-form input[name='tel']").val(),
        }

        $.post("/registration", sendData, function (data) {
            if (data.result == "success") {

                // Klap form in
                $(".formContainer").collapse('hide');

                // Laat bedankt melding zien
                $(".msgContainer").collapse('show');

                // Maak form leeg
                $(".main-form input").val("");

            } else if (data.result == "error") {
                if (data.errorCode == "item_exists" || data.errorCode == "input_invalid") {
                    var errorMsgText = {
                        input_invalid: { teamname: "Vul een naam in van minimaal 3 en maximaal 255 tekens", email: "Het email adres is ongeldig" },
                        item_exists: { teamname: "Deze naam bestaat al, probeer een andere.", email: "Met dit e-mail adres is al een team ingeschreven, probeer een andere." }
                    }
                    // Remove all errors
                    $(`.main-form input`).removeClass("is-invalid");
                    $(`.main-form input`).removeClass("is-valid");
                    $(`.main-form`).removeClass("was-validated");

                    // Loop trough returning errors and mark specific inputs invalid
                    for (key in data.errorMsg) {
                        console.log(key)
                        let selector = $(`.main-form input[name='${data.errorMsg[key]}']`);
                        selector.addClass("is-invalid");

                        console.log(errorMsgText[data.errorCode][data.errorMsg[key]])
                        selector.siblings(".invalid-feedback").html(errorMsgText[data.errorCode][data.errorMsg[key]])
                    }

                } else {
                    showError("Er ging iets niet goed.", "Probeer het later nog een keer");
                    console.error(data.errorCode);
                }
            } else {
                callback(data);
            }
        })

    }
    $(this).addClass('was-validated');
})
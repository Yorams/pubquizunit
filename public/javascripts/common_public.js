var qOneTemplate = Handlebars.compile($('#qOneTemplate').html());
var qMultiTemplate = Handlebars.compile($('#qMultiTemplate').html());
var qOpenNumericTemplate = Handlebars.compile($('#qOpenNumericTemplate').html());
var qOpenTextTemplate = Handlebars.compile($('#qOpenTextTemplate').html());
var qMusicTemplate = Handlebars.compile($('#qMusicTemplate').html());
var qMusicLocatieTemplate = Handlebars.compile($('#qMusicLocatieTemplate').html());
var qNameYearTemplate = Handlebars.compile($('#qNameYearTemplate').html());
var introTemplate = Handlebars.compile($('#introTemplate').html());
var qAlertTemplate = Handlebars.compile($('#qAlertTemplate').html());

var countdownTimer;
var countdownTime = 0;

var locaties = ["Klavertje 4", "De Stek", "De Vlinder", "De Grund", "Vikingenpoort", "De Plantage", "'t Schoolhuys", "De Heuvel", "De Boog", "Het Kamp", "12plus", "Food & Beverage (F&B)", "Ondersteuningsgroep (OG)", "Opening & Sluiting (O&S)", "Crea", "Communicatie", "Promo", "Sponsoring", "Bergjes", "Klusteam", "Webmaster", "Griezeltocht", "Fladderkrant", "Lustrumcomité", "Feestcommissie"]

Handlebars.registerHelper('questionType', function (type) {
    var returnValue = "";
    switch (type) {
        case "one":
            returnValue = "Kies één antwoord."
            break;
        case "multi":
            returnValue = "Kies een of meerdere antwoorden."
            break;
        case "open-numeric":
            returnValue = "Vul een getal in."
            break;
        case "open-text":
            returnValue = "Typ je antwoord."
            break;
        case "music":
            returnValue = "Vul de artiest en titel in"
            break;
        case "music-locatie":
            returnValue = "Vul de artiest, titel en de juiste locatie in"
            break;
        case "name-year":
            returnValue = "Vul de naam van de persoon op de foto in en het bijbehorende jaartal."
            break;

    }
    return returnValue;
})

function countdown(sec, action) {
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
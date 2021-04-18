var scoreBoard = Handlebars.compile($('#scoreBoard').html());
var questionTemplates;


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

    if (typeof (type) != "undefined") {
        var currentParameters = questionTemplates.find((obj) => {
            return obj.id === type
        })

        for (key in data) {
            var parameter = currentParameters.parameters.find((obj) => {
                return obj.id === data[key].id
            })
            returnData = returnData + `<b>${parameter.name}:</b> ${data[key].correct}<br>`
        }

    }
    return returnData
})

Handlebars.registerHelper('showScore', function (data, template) {
    if (template == "message") {
        return ""
    } else {
        if (typeof (data) !== "undefined") {
            return data;
        } else {
            return ""
        }
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
    refreshTimer = setInterval(function () {
        loadScore("overview");
    }, 5000)
}

function loadScore (view) {
    sendPost("getScore", function (data) {
        questionTemplates = data.questionTemplates

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



$("#tsparticles")
    .particles()
    .init(
        {
            "autoPlay": true,


            "fullScreen": {
                "enable": true,
                "zIndex": 1
            },
            "detectRetina": true,
            "fpsLimit": 60,
            "infection": {
                "cure": false,
                "delay": 0,
                "enable": false,
                "infections": 0,
                "stages": []
            },
            "interactivity": {
                "detectsOn": "canvas",
                "events": {
                    "onClick": {
                        "enable": false,
                        "mode": "push"
                    },
                    "onDiv": {
                        "selectors": [],
                        "enable": false,
                        "mode": [],
                        "type": "circle"
                    },
                    "onHover": {
                        "enable": false,
                        "mode": "repulse",
                        "parallax": {
                            "enable": false,
                            "force": 2,
                            "smooth": 10
                        }
                    },
                    "resize": true
                },
                "modes": {
                    "attract": {
                        "distance": 200,
                        "duration": 0.4,
                        "speed": 1
                    },
                    "bounce": {
                        "distance": 200
                    },
                    "bubble": {
                        "distance": 400,
                        "duration": 2,
                        "opacity": 0.8,
                        "size": 40
                    },
                    "connect": {
                        "distance": 80,
                        "links": {
                            "opacity": 0.5
                        },
                        "radius": 60
                    },
                    "grab": {
                        "distance": 400,
                        "links": {
                            "blink": false,
                            "consent": false,
                            "opacity": 1
                        }
                    },
                    "light": {
                        "area": {
                            "gradient": {
                                "start": {
                                    "value": "#ffffff"
                                },
                                "stop": {
                                    "value": "#000000"
                                }
                            },
                            "radius": 1000
                        },
                        "shadow": {
                            "color": {
                                "value": "#000000"
                            },
                            "length": 2000
                        }
                    },
                    "push": {
                        "quantity": 4
                    },
                    "remove": {
                        "quantity": 2
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4,
                        "speed": 1
                    },
                    "slow": {
                        "factor": 3,
                        "radius": 200
                    },
                    "trail": {
                        "delay": 1,
                        "quantity": 1
                    }
                }
            },
            "manualParticles": [],
            "motion": {
                "disable": false,
                "reduce": {
                    "factor": 4,
                    "value": false
                }
            },
            "particles": {
                "bounce": {
                    "horizontal": {
                        "random": {
                            "enable": false,
                            "minimumValue": 0.1
                        },
                        "value": 1
                    },
                    "vertical": {
                        "random": {
                            "enable": false,
                            "minimumValue": 0.1
                        },
                        "value": 1
                    }
                },
                "collisions": {
                    "bounce": {
                        "horizontal": {
                            "random": {
                                "enable": false,
                                "minimumValue": 0.1
                            },
                            "value": 1
                        },
                        "vertical": {
                            "random": {
                                "enable": false,
                                "minimumValue": 0.1
                            },
                            "value": 1
                        }
                    },
                    "enable": false,
                    "mode": "bounce",
                    "overlap": {
                        "enable": true,
                        "retries": 0
                    }
                },
                "color": {
                    "value": "#32bef8",
                    "animation": {
                        "h": {
                            "count": 5,
                            "enable": false,
                            "offset": 0,
                            "speed": 10,
                            "sync": false
                        },
                        "s": {
                            "count": 100,
                            "enable": true,
                            "offset": 0,
                            "speed": 10,
                            "sync": false
                        },
                        "l": {
                            "count": 100,
                            "enable": false,
                            "offset": 0,
                            "speed": 10,
                            "sync": false
                        }
                    }
                },
                "destroy": {
                    "mode": "split",
                    "split": {
                        "count": 10,
                        "factor": {
                            "random": {
                                "enable": false,
                                "minimumValue": 0
                            },
                            "value": 3
                        },
                        "rate": {
                            "random": {
                                "enable": false,
                                "minimumValue": 0
                            },
                            "value": {
                                "min": 4,
                                "max": 9
                            }
                        }
                    }
                },
                "life": {
                    "count": 1,
                    "delay": {
                        "random": {
                            "enable": false,
                            "minimumValue": 0
                        },
                        "value": 0,
                        "sync": false
                    },
                    "duration": {
                        "random": {
                            "enable": false,
                            "minimumValue": 0.0001
                        },
                        "value": 0,
                        "sync": false
                    }
                },
                "links": {
                    "blink": false,
                    "color": {
                        "value": "#ffffff"
                    },
                    "consent": false,
                    "distance": 150,
                    "enable": false,
                    "frequency": 1,
                    "opacity": 0.4,
                    "shadow": {
                        "blur": 5,
                        "color": {
                            "value": "#00ff00"
                        },
                        "enable": false
                    },
                    "triangles": {
                        "enable": false,
                        "frequency": 1
                    },
                    "width": 1,
                    "warp": false
                },
                "move": {
                    "angle": {
                        "offset": 45,
                        "value": 90
                    },
                    "attract": {
                        "enable": false,
                        "rotate": {
                            "x": 600,
                            "y": 1200
                        }
                    },
                    "decay": 0,
                    "distance": 0,
                    "direction": "none",
                    "drift": 0,
                    "enable": true,
                    "gravity": {
                        "acceleration": 9.81,
                        "enable": false,
                        "maxSpeed": 40
                    },
                    "path": {
                        "clamp": true,
                        "delay": {
                            "random": {
                                "enable": false,
                                "minimumValue": 0
                            },
                            "value": 0
                        },
                        "enable": false
                    },
                    "outModes": {
                        "default": "destroy",
                        "bottom": "destroy",
                        "left": "destroy",
                        "right": "destroy",
                        "top": "destroy"
                    },
                    "random": false,
                    "size": false,
                    "speed": 4,
                    "straight": false,
                    "trail": {
                        "enable": false,
                        "length": 10,
                        "fillColor": {
                            "value": "#000000"
                        }
                    },
                    "vibrate": false,
                    "warp": false
                },
                "number": {
                    "density": {
                        "enable": true,
                        "area": 800,
                        "factor": 1000
                    },
                    "limit": 0,
                    "value": 0
                },
                "opacity": {
                    "random": {
                        "enable": false,
                        "minimumValue": 0.1
                    },
                    "value": 1,
                    "animation": {
                        "count": 0,
                        "enable": false,
                        "speed": 3,
                        "sync": false,
                        "destroy": "none",
                        "minimumValue": 0.1,
                        "startValue": "random"
                    }
                },
                "reduceDuplicates": false,
                "rotate": {
                    "random": {
                        "enable": false,
                        "minimumValue": 0
                    },
                    "value": 0,
                    "animation": {
                        "enable": false,
                        "speed": 0,
                        "sync": false
                    },
                    "direction": "clockwise",
                    "path": false
                },
                "shadow": {
                    "blur": 0,
                    "color": {
                        "value": "#000000"
                    },
                    "enable": false,
                    "offset": {
                        "x": 0,
                        "y": 0
                    }
                },
                "shape": {
                    "options": {},
                    "type": "circle"
                },
                "size": {
                    "random": {
                        "enable": false,
                        "minimumValue": 1
                    },
                    "value": {
                        "min": 5,
                        "max": 10
                    },
                    "animation": {
                        "count": 0,
                        "enable": true,
                        "speed": 5,
                        "sync": true,
                        "destroy": "none",
                        "minimumValue": 0.1,
                        "startValue": "min"
                    }
                },
                "stroke": {
                    "width": 0
                },
                "twinkle": {
                    "lines": {
                        "enable": false,
                        "frequency": 0.05,
                        "opacity": 1
                    },
                    "particles": {
                        "enable": false,
                        "frequency": 0.05,
                        "opacity": 1
                    }
                }
            },
            "pauseOnBlur": true,
            "pauseOnOutsideViewport": true,
            "responsive": [],
            "themes": [],
            "emitters": {
                "autoPlay": true,
                "direction": "top",
                "life": {},
                "rate": {
                    "quantity": 1,
                    "delay": 0.3
                },
                "size": {
                    "mode": "percent",
                    "height": 0,
                    "width": 100
                },
                "position": {
                    "x": 50,
                    "y": 100
                }
            }
        },
        function (container) {
            // container is the particles container where you can play/pause or stop/start.
            // the container is already started, you don't need to start it manually.
        }
    );

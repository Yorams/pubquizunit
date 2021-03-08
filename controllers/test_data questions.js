
var mainQuestionData = [
    {// Round 1
        guid: "a759e11c-a677-44c3-8b56-522fcb4d4cc7",
        name: "First round",
        details: "Vragen over de eerste ronde",
        questions: [
            {
                guid: "179c2eae-e5a7-425c-8bb6-ca42156feff3",
                name: "De hoofdsponsor van Fladderen is Albert Heijn. Daarvoor was Ouwehands Dierenpark de belangrijkste sponsor. Wie was het daarvoor?",
                template: "single",
                parameters: [
                    {
                        name: "Kies een sponsor",
                        type: "radio",
                        content: [
                            "Albert Heijn",
                            "SNS Bank",
                            "Rabobank",
                            "Fortis Bank"
                        ],
                        correct: [
                            "SNS Bank"
                        ]
                    }
                ],

            }, {
                guid: "e7395668-40f1-46ef-b8e0-f2dd122e4506",
                name: "Fladderen heeft twee vertrouwenspersonen. Wie zijn dat?",
                template: "multi",
                parameters: [
                    {
                        name: "Kies een naam",
                        type: "checkbox",
                        content: [
                            "Nelleke Samwel",
                            "Wilma van Geresteijn",
                            "Monique Boere",
                            "Lysanne Scheer",
                            "Trea"
                        ],
                        correct: [
                            "Nelleke Samwel",
                            "Wilma van Geresteijn"
                        ]
                    }
                ]
            }
        ]
    }, {// Round 2
        guid: "3f72ecc5-4851-48e6-9058-21204485309e",
        name: "Second round",
        details: "Vragen over de 2e ronde",
        questions: [
            {
                guid: "a30bd47a-c9c4-434a-989d-e91473174cf3",
                name: "Fladderen heeft twee vertrouwenspersonen. Wie zijn dat?",
                template: "multi",
                parameters: [
                    {
                        name: "Kies een naam",
                        type: "checkbox",
                        content: [
                            "Nelleke Samwel",
                            "Wilma van Geresteijn",
                            "Monique Boere",
                            "Lysanne Scheer",
                            "Trea"
                        ],
                        correct: [
                            "Nelleke Samwel",
                            "Wilma van Geresteijn"
                        ]
                    }
                ]
            },
            {
                "guid": "d2e3b6d4-784b-64b1-7151-8b7e20d9fa26",
                "name": "Noem het nummer",
                "template": "music",
                "parameters": [
                    {
                        "type": "text",
                        "name": "Artist",
                        "id": "artist",
                        correct: [
                            "Henkie",
                        ]
                    },
                    {
                        "type": "text",
                        "name": "Title",
                        "id": "title",
                        correct: [
                            "Je moeder",
                        ]
                    }
                ]
            }, {
                "guid": "944df793-5a16-b4d4-ac59-ec3c95736360",
                "name": "Vul het jaartal in ofzo",
                "template": "open-number",
                "parameters": [
                    {
                        "type": "number",
                        "name": "Enter a number",
                        "id": "default",
                        correct: [
                            2020,
                        ]
                    }
                ]
            }, {
                "guid": "16320f60-e055-e97b-c3cd-24561c080853",
                "name": "Typ eens iets",
                "template": "open-text",
                "parameters": [
                    {
                        "type": "text",
                        "name": "Type your answer",
                        "id": "default",
                        correct: [
                            "Fout",
                        ]
                    }
                ]
            }
        ]
    }
];
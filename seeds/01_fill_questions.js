exports.seed = function (knex) {
    // Check if there are rounds present
    return knex('rounds')
        .then((rows) => {
            if (rows.length == 0) {
                // No rounds found, so probarly the questions database is empty

                // Insert round
                return knex('rounds').insert([
                    { uuid: "184be0b5-c6e2-4b8c-b6b2-711f6316620c", name: 'Round One', order: 0 }
                ]).then(() => {
                    // Insert question
                    return knex("questions").insert([{
                        uuid: "635e6938-c053-4e8d-8f0b-6b140bd42b13",
                        round: "184be0b5-c6e2-4b8c-b6b2-711f6316620c",
                        name: 'Who is the best?',
                        template: "open-text",
                        order: 0,
                        parameters: JSON.stringify([{
                            id: "default",
                            correct: "Me myself and i",
                            name: "Type your answer",
                            type: "text",
                            edited_by: 0
                        }])
                    }
                    ])
                });
            } else {
                console.log("There are rounds present, so doing nothing...")
            }
        });
};

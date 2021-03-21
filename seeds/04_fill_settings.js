exports.seed = function (knex) {
    // Check if there are rounds present
    return knex('settings')
        .then((rows) => {
            if (rows.length == 0) {
                // No rounds found, so probarly the questions database is empty

                // Insert round
                return knex('settings').insert([
                    //{ id: "current_question", details: "This is de UUID of the current question", type: "string", value: "635e6938-c053-4e8d-8f0b-6b140bd42b13" },
                    { id: "quiz_live", details: "Global state of the quiz", type: "boolean", value: true }
                ])
            } else {
                console.log("There are settings present, so doing nothing...")
            }
        });
};

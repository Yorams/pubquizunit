exports.seed = function (knex) {

    // Deletes ALL existing entries
    return knex('answers').del()
        .then(function () {

            // Reset current question
            return knex('current_question')
                .where({ name: "current" })
                .update({ round: 0, question: 0 });
        });
};
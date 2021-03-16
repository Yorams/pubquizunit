
exports.up = function (knex) {

    return knex.schema
        .createTable('current_question', function (table) {
            table.string('name')
            table.integer('question')
        })
        .createTable('answers', function (table) {
            table.increments()
            table.string('team_uuid')
            table.string('question_uuid')
            table.json('answer')
            table.timestamp('answered_at').defaultTo(knex.fn.now());
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('current_question')
        .dropTable('answers')
};

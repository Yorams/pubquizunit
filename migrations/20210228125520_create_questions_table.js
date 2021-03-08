exports.up = function (knex) {

    return knex.schema
        .createTable('questions', function (table) {
            table.increments("id")
            table.uuid("uuid")
            table.string("round")
            table.string('name')
            table.text('details')
            table.string('template')
            table.json('parameters')
            table.integer('edited_by')
            table.timestamp('edited').defaultTo(knex.fn.now());
            table.integer('order')
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('questions')
};

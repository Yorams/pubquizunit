exports.up = function (knex) {

    return knex.schema
        .createTable('rounds', function (table) {
            table.increments("id")
            table.uuid("uuid")
            table.string('name')
            table.text('details')
            table.integer('order')
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('rounds')
};

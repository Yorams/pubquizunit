exports.up = function (knex) {

    return knex.schema
        .createTable('settings', function (table) {
            table.string("id")
            table.text('details')
            table.string('type')
            table.json('value')
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('settings')
};

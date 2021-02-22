exports.up = function (knex) {

    return knex.schema
        .createTable('sessions', function (table) {
            table.string('sid')
            table.json('sess')
            table.timestamp('expired')
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('sessions')
};

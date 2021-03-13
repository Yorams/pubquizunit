exports.up = function (knex) {

    return knex.schema
        .createTable('teams', function (table) {
            table.increments()
            table.string('name')
            table.string('uuid')
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('teams')
};

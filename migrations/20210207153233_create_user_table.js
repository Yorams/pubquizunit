
exports.up = function (knex) {

    return knex.schema
        .createTable('users', function (table) {
            table.increments()
            table.string('username')
            table.text('password')
            table.text('salt')
            table.string('role')
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('users')
};

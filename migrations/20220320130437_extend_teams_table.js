
exports.up = function (knex) {
    return knex.schema.alterTable('teams', function (table) {
        table.string("email")
        table.string("tel")
        table.string("status")
        table.datetime("lastSeen");
    })
};

exports.down = function (knex) {
    return knex.schema.alterTable('teams', function (table) {
        table.dropColumn("email")
        table.dropColumn("tel")
        table.dropColumn("status")
        table.dropColumn("lastSeen");
    })
};

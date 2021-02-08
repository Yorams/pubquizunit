exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        { username: "admin", password: "4644a866536907f000a2ea350499e0afcaffa8423484e993a108dbe51f642000", salt: "f14cf1eb19dc3e635c6dd7914ca55df2", role: "admin" }
      ]);
    });
};
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        { username: "admin", password: "467d07f2294a561c788f5c6bb002f49aa7e055ba7a2848be77c03ff9246c4693", salt: "2a0b0634a258842f8b88610ff92598385dd41507", role: "admin" }
      ]);
    });
};
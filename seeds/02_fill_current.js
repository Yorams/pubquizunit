exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('current_question').del()
    .then(function () {
      // Inserts seed entries
      return knex('current_question').insert([
        { name: "current", question: "635e6938-c053-4e8d-8f0b-6b140bd42b13" }
      ]);
    });
};

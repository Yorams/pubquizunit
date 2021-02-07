exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('current_question').del()
    .then(function () {
      // Inserts seed entries
      return knex('current_question').insert([
        { name: "current", round: 0, question: 0 }
      ]);
    });
};

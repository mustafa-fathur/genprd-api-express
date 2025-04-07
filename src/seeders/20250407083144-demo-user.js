'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.bulkInsert('users', [
      {
        google_id: 'google-123',
        email: 'mustafa@gmail.com',
        name: 'Mustafa',
        avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocIpqw7Eb-3cz3zF0_LpyF6ddKMUTV2-HArftz1VBTW0LuBMozw=s360-c-no',
        password: 'mustafa123',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        google_id: 'google-456',
        email: 'fathur@gmail.com',
        name: 'Fathur',
        avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocK42iryDtRdeFfJvTcKqFb4Xe-lp1rgCbfVxXGLo9AtKPE0EonD=s360-c-no',
        password: 'fathur123',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('personnels', [
      {
        user_id: 1,
        name: 'Urrr',
        role: 'Prompt Engineer',
        contact: 'urrr@vibecodes.com',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 1,
        name: 'Rahman',
        role: 'AI Artist',
        contact: 'rahman@ghibli.com',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('personnels', null, {});
  }
};

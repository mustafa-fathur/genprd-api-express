'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('refresh_tokens', [
      {
        user_id: 1,
        token: 'refreshtoken1',
        expires_at: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        token: 'refreshtoken2',
        expires_at: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('refresh_tokens', null, {});
  }
};

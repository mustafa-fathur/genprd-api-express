'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('prds', [
      {
        user_id: 1,
        document_version: 'v1.0',
        document_stage: 'draft',
        product_name: 'AI PRD Maker',
        project_overview: 'A tool to generate PRDs using AI',
        start_date: '2025-04-01',
        end_date: '2025-06-30',
        document_owners: JSON.stringify([{ name: 'Mustafa', email: 'mustafa@gmail.com' }]),
        developers: JSON.stringify(['Urrr']),
        stakeholders: JSON.stringify(['CTO', 'PM']),
        darci_roles: JSON.stringify({ D: 'Fulan', A: 'Fulana', R: 'PM', C: 'CTO', I: 'QA' }),
        generated_sections: JSON.stringify(['Overview', 'Scope', 'Goals']),
        timeline: JSON.stringify([{ phase: 'Planning', date: '2025-04-01' }]),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('prds', null, {});
  }
};

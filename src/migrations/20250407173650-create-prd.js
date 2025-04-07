'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PRDs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unique: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      document_version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      document_stage: {
        type: Sequelize.ENUM('draft', 'inprogress', 'finished', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      project_overview: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      document_owners: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      developers: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      stakeholders: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      darci_roles: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      generated_sections: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      timeline: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PRDs');
  }
};
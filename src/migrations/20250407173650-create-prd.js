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
        allowNull: true,
      },
      developers: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      stakeholders: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      darci_roles: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      generated_sections: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      timeline: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      last_viewed_at: {
        type: Sequelize.DATE,
        allowNull: true
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
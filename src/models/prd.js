'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PRD extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PRD.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  PRD.init({
    user_id: DataTypes.INTEGER,
    document_version: DataTypes.STRING,
    document_stage: DataTypes.ENUM('draft', 'inprogress', 'finished', 'archived'),
    product_name: DataTypes.STRING,
    project_overview: DataTypes.TEXT,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    document_owners: DataTypes.JSON,
    developers: DataTypes.JSON,
    stakeholders: DataTypes.JSON,
    darci_roles: DataTypes.JSON,
    generated_sections: DataTypes.JSON,
    timeline: DataTypes.JSON,
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    last_viewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'PRD',
    tableName: 'prds',
    underscored: true,
  });
  return PRD;
};
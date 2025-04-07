'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Personnel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Personnel.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  Personnel.init({
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    role: DataTypes.STRING,
    contact: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Personnel',
    underscored: true,
  });
  return Personnel;
};
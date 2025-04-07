'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Refresh_Token extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Refresh_Token.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  Refresh_Token.init({
    user_id: DataTypes.INTEGER,
    token: DataTypes.TEXT,
    expires_at: DataTypes.DATE,
    revoked: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Refresh_Token',
    underscored: true,
  });
  return Refresh_Token;
};
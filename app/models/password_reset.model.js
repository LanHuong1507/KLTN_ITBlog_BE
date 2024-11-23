const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const PasswordReset = sequelize.define(
  "password_reset",
  {
    reset_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reset_token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "password_resets",
    timestamps: false,
  },
);

module.exports = PasswordReset;

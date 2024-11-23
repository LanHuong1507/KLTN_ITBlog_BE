const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const SearchHistory = sequelize.define(
  "search_history",
  {
    search_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    keyword: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "search_history",
    timestamps: true,
  },
);

module.exports = SearchHistory;

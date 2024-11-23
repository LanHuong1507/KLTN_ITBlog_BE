const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const ArticleView = sequelize.define(
  "article_view",
  {
    view_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "article_views",
    timestamps: false,
  },
);

module.exports = ArticleView;

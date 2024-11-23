const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");
const User = require("./user.model.js");
const Article = require("./article.model.js");

const Notification = sequelize.define(
  "notification",
  {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("comment", "like", "follow"),
      allowNull: false,
    },
    related_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  },
);

// Định nghĩa quan hệ với User và Article
Notification.belongsTo(User, {
  foreignKey: "related_user_id",
  as: "related_user",
});
Notification.belongsTo(Article, { foreignKey: "article_id" });

module.exports = Notification;

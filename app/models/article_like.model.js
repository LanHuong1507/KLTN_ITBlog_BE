const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const ArticleLike = sequelize.define("article_like", {
    like_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    article_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "article_likes",
    timestamps: true
});

module.exports = ArticleLike;

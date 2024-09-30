const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const ArticleCategory = sequelize.define("article_category", {
    article_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    }
}, {
    tableName: "article_categories",
    timestamps: false
});

module.exports = ArticleCategory;

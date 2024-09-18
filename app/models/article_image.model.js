const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const ArticleImage = sequelize.define("article_image", {
    image_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    article_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: "article_images",
    timestamps: false
});

module.exports = ArticleImage;

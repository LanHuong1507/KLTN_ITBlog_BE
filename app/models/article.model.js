const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const Article = sequelize.define("article", {
    article_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tags: {
        type: DataTypes.STRING,
        allowNull: true
    },
    privacy: {
        type: DataTypes.ENUM("public", "private"),
        allowNull: false,
        defaultValue: "private"
    },
    is_draft: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: "articles",
    timestamps: true
});

module.exports = Article;

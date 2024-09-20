const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");
const Article = require("./article.model.js"); 
const User = require("./user.model.js");

const Comment = sequelize.define("comment", {
    comment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    article_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Article, // Tạo quan hệ với bảng articles
            key: 'article_id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Tạo quan hệ với bảng users
            key: 'user_id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: "comments",
    timestamps: true
});

// Thiết lập quan hệ (Associations)
Comment.belongsTo(Article, { foreignKey: "article_id" });
Comment.belongsTo(User, { foreignKey: "user_id" });

module.exports = Comment;

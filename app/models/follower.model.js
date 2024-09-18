const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");
const User = require('./user.model.js');  

const Follower = sequelize.define("follower", {
    follower_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    follower_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,  
            key: 'user_id'
        }
    },
    followed_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,  
            key: 'user_id'
        }
    }
}, {
    tableName: "followers",
    timestamps: true
});

// Thiết lập các quan hệ
Follower.belongsTo(User, { foreignKey: 'follower_user_id', as: 'FollowerUser' });
Follower.belongsTo(User, { foreignKey: 'followed_user_id', as: 'FollowedUser' });

module.exports = Follower;

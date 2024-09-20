const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config.js");

const ReadingList = sequelize.define("reading_list", {
    list_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: "reading_lists",
    timestamps: true
});

module.exports = ReadingList;

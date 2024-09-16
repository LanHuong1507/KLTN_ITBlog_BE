const Sequelize = require('sequelize');
const sequelize = new Sequelize('blog_tech', 'root', '', {
  dialect: 'mysql',
  host: 'localhost',
  logging: false, // tắt log
});

module.exports = sequelize;
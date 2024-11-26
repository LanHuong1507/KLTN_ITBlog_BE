const Sequelize = require('sequelize');
const sequelize = new Sequelize('zpwmkh7e6o5f_blog_tech', 'zpwmkh7e6o5f_root', 'Tienlan2024@', {
  dialect: 'mysql',
  host: '137.59.105.46',
  logging: false, // tắt log
});

module.exports = sequelize;

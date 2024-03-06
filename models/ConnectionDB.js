const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_TYPE,
  }
);
module.exports = sequelize;

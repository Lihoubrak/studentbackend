const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Notification = sequelize.define(
  "Notification",
  {
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Notification;

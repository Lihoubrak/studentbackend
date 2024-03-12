const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const ExpoNotifications = sequelize.define(
  "ExpoNotifications",
  {
    expo_push_token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sent_at: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = ExpoNotifications;

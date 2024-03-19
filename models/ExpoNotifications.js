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
    isSeen: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = ExpoNotifications;

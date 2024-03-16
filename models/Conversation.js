const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Conversation = sequelize.define(
  "Conversation",
  {
    type: {
      type: DataTypes.ENUM("personal", "group"),
      defaultValue: "personal",
    },
    status: {
      type: DataTypes.ENUM("active", "paused", "ended"),
      defaultValue: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Conversation;

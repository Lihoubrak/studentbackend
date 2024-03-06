const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const SupportEvent = sequelize.define(
  "SupportEvent",
  {
    supportName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    supportSpecific: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = SupportEvent;

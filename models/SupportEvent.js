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
    typePay: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = SupportEvent;

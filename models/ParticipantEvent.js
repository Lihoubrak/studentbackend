const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const ParticipantEvent = sequelize.define(
  "ParticipantEvent",
  {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    typePayMoney: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payMoney: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = ParticipantEvent;

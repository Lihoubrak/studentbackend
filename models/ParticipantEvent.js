const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const ParticipantEvent = sequelize.define(
  "ParticipantEvent",
  {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    timestamps: true,
  }
);

module.exports = ParticipantEvent;

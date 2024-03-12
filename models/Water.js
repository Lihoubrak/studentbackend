const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");
const Water = sequelize.define(
  "Water",
  {
    oldIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exceedLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalConsumption: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pricePerKwh: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 4800.0,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    support: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 6,
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

module.exports = Water;

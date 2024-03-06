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
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    support: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Water;

const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");
const Electrical = sequelize.define(
  "Electrical",
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
      defaultValue: 2215.0,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    support: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
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

module.exports = Electrical;

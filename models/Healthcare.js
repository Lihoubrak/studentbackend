const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Healthcare = sequelize.define(
  "Healthcare",
  {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    totalPatientPay: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    hospital: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Healthcare;

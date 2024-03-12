const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Dormitory = sequelize.define(
  "Dormitory",
  {
    dormName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dormLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dormDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dormImage: {
      type: DataTypes.STRING,
      defaultValue: "No Image",
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Dormitory;

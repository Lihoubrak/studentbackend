const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Major = sequelize.define(
  "Major",
  {
    majorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    majorDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    majorImage: {
      type: DataTypes.STRING,
      defaultValue: "No Image",
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Major;

const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const School = sequelize.define(
  "School",
  {
    schoolName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schoolLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schoolDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schoolImage: {
      type: DataTypes.STRING,
      defaultValue: "No Image",
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = School;

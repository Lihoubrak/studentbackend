const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Passport = sequelize.define(
  "Passport",
  {
    passportNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateofbirth: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placeofbirth: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placeofissue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateofissue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateofexpiry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      defaultValue: "No Image",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Passport;

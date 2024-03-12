const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Room = sequelize.define(
  "Room",
  {
    roomNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    numberOfStudents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Room;

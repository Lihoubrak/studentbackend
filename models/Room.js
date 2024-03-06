const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Room = sequelize.define(
  "Room",
  {
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numberOfStudents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Room;

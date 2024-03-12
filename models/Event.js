const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Event = sequelize.define(
  "Event",
  {
    eventName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventImage: {
      type: DataTypes.STRING,
      defaultValue: "No Image",
      allowNull: false,
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    eventExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    foodMenu: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    eventsInProgram: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    ticketPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentPerStudent: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    numberOfTicket: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Event;

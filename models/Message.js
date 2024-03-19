const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");
const Message = sequelize.define(
  "Message",
  {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sticker: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Message;

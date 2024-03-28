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
    seen_by_user1: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    seen_by_user2: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Message;

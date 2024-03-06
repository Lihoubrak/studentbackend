const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectionDB");

const Role = sequelize.define(
  "Role",
  {
    roleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Role;

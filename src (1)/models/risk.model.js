const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Risk = sequelize.define("Risk", {
  region: DataTypes.STRING,
  riskType: DataTypes.STRING,
  severity: DataTypes.STRING
});

module.exports = Risk;
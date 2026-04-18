const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Alert = sequelize.define("Alert", {
  region: DataTypes.STRING,
  city: DataTypes.STRING,
  farmerName: DataTypes.STRING,
  phone: DataTypes.STRING,
  language: DataTypes.STRING,
  channel: DataTypes.STRING,
  riskType: DataTypes.STRING,
  severity: DataTypes.STRING,
  recommendation: DataTypes.TEXT,
  message: DataTypes.TEXT,
  status: DataTypes.STRING
});

module.exports = Alert;

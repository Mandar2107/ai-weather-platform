const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Weather = sequelize.define("Weather", {
  region: {
    type: DataTypes.STRING,
    allowNull: false
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  humidity: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fetchedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Weather;

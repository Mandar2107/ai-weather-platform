const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Farmer = sequelize.define("Farmer", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false
  },
  village: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  taluka: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  district: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  state: {
    type: DataTypes.STRING,
    defaultValue: "Maharashtra"
  },
  cropType: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  landSizeAcres: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  irrigationType: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: "en"
  },
  smsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  voiceEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  whatsappEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ""
  }
});

module.exports = Farmer;

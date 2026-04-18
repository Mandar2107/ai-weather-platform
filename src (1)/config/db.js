const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite connected");
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
};

module.exports = { sequelize, connectDB };
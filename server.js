require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const { sequelize, connectDB } = require("./src/config/db");
const notificationService = require("./src/services/notification.service");

require("./src/models/user.model");
require("./src/models/farmer.model");
require("./src/models/weather.model");
require("./src/models/risk.model");
require("./src/models/alert.model");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

global.io = io;

const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log("Database synced");
    notificationService.warnIfTwilioLooksMisconfigured("+919686737219");

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });

    server.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();

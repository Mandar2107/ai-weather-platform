const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const farmerRoutes = require("./routes/farmer.routes");
const weatherRoutes = require("./routes/weather.routes");
const aiRoutes = require("./routes/ai.routes");
const alertRoutes = require("./routes/alert.routes");
const settingsRoutes = require("./routes/settings.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/alerts", alertRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "AI Weather Platform API Running",
    status: "ok"
  });
});

module.exports = app;

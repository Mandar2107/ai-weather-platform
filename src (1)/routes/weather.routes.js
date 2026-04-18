const express = require("express");
const router = express.Router();

const weatherController = require("../controllers/weather.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/fetch", authMiddleware, weatherController.fetchWeather);
router.get("/", authMiddleware, weatherController.getWeather);

module.exports = router;
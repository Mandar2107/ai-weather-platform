const weatherService = require("../services/weather.service");

exports.fetchWeather = async (req, res) => {
  try {
    const { region } = req.body;

    if (!region) {
      return res.status(400).json({ message: "Region is required" });
    }

    const data = await weatherService.fetchWeather(region);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWeather = async (req, res) => {
  try {
    const data = await weatherService.getWeather(req.query);

    if ((req.query.latest === "true" || req.query.latest === true) && !data) {
      return res.status(404).json({ message: "No weather data found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const axios = require("axios");
const { Op } = require("sequelize");
const Weather = require("../models/weather.model");

exports.fetchWeather = async (region) => {
  const normalizedRegion = region?.trim();
  const apiKey = process.env.WEATHER_API_KEY;

  if (!normalizedRegion) {
    throw new Error("Region is required");
  }

  if (!apiKey) {
    throw new Error("WEATHER_API_KEY is missing");
  }

  try {
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(normalizedRegion)}?unitGroup=metric&contentType=json&key=${apiKey}`;
    const response = await axios.get(url);
    const current = response.data.currentConditions;

    return await Weather.create({
      region: normalizedRegion,
      temperature: current.temp,
      humidity: current.humidity,
      condition: current.conditions,
      fetchedAt: current.datetimeEpoch
        ? new Date(current.datetimeEpoch * 1000)
        : new Date()
    });
  } catch (error) {
    console.error("Weather fetch failed:", error.message);
    throw new Error("Weather fetch failed");
  }
};

exports.getWeather = async ({ region, latest } = {}) => {
  const where = {};

  if (region?.trim()) {
    where.region = {
      [Op.like]: region.trim()
    };
  }

  if (latest === "true" || latest === true) {
    return await Weather.findOne({
      where,
      order: [["fetchedAt", "DESC"], ["createdAt", "DESC"]]
    });
  }

  return await Weather.findAll({
    where,
    order: [["fetchedAt", "DESC"], ["createdAt", "DESC"]],
    limit: 20
  });
};

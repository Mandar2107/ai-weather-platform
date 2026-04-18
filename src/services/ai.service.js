const Weather = require("../models/weather.model");
const Risk = require("../models/risk.model");

exports.analyzeRisk = async (region) => {
  const normalizedRegion = region?.trim();

  if (!normalizedRegion) {
    throw new Error("Region is required");
  }

  const weather = await Weather.findOne({
    where: { region: normalizedRegion },
    order: [["fetchedAt", "DESC"], ["createdAt", "DESC"]]
  });

  if (!weather) {
    throw new Error("No weather data found");
  }

  let riskType = "NORMAL";
  let severity = "LOW";

  if (weather.humidity > 85 && weather.condition.includes("Rain")) {
    riskType = "FLOOD";
    severity = "HIGH";
  } else if (weather.temperature > 38 && weather.humidity < 30) {
    riskType = "DROUGHT";
    severity = "HIGH";
  } else if (weather.condition.includes("Storm")) {
    riskType = "STORM";
    severity = "MEDIUM";
  }

  const risk = await Risk.create({
    region: normalizedRegion,
    riskType,
    severity
  });

  return {
    ...risk.toJSON(),
    recommendation:
      severity === "HIGH"
        ? "Activate farmer alerts and prepare response measures."
        : severity === "MEDIUM"
          ? "Monitor conditions closely and notify local operators."
          : "Conditions look stable. Continue routine monitoring."
  };
};

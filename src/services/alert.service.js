const Farmer = require("../models/farmer.model");
const Alert = require("../models/alert.model");
const notificationService = require("./notification.service");
const advisoryService = require("./advisory.service");
const { Op } = require("sequelize");

const normalizeRegion = (payload = {}) => payload.region?.trim() || payload.city?.trim() || "";

const getTargetFarmers = async (region, farmerIds = []) => {
  if (!region) {
    throw new Error("Region is required");
  }

  const where = { city: region, active: true };

  if (Array.isArray(farmerIds) && farmerIds.length) {
    where.id = {
      [Op.in]: farmerIds.map((id) => Number(id)).filter(Boolean)
    };
  }

  return await Farmer.findAll({
    where,
    order: [["createdAt", "DESC"]]
  });
};

const buildFarmerMessage = (farmer, payload) => {
  const mode = payload.messageMode || "ai";

  if (mode === "custom") {
    const language = advisoryService.normalizeLanguage(payload.language || farmer.language);
    return {
      language,
      recommendation: payload.recommendation || "Operator broadcast message",
      message: payload.customMessage?.trim() || `Attention farmers in ${farmer.city}. Please review the latest advisory.`
    };
  }

  return advisoryService.buildAdvisory({
    name: farmer.name,
    city: farmer.city,
    cropType: farmer.cropType,
    riskType: payload.riskType || "WEATHER",
    severity: payload.severity || "LOW",
    language: farmer.language
  });
};

const buildChannelPlan = (farmer, requestedChannels = []) => {
  if (requestedChannels.length) {
    return requestedChannels.filter((channel) => {
      if (channel === "sms") return farmer.smsEnabled;
      if (channel === "voice") return farmer.voiceEnabled;
      if (channel === "dashboard") return true;
      return false;
    });
  }

  const channels = [];
  if (farmer.smsEnabled) channels.push("sms");
  if (farmer.voiceEnabled) channels.push("voice");
  if (!channels.length) channels.push("dashboard");
  return channels;
};

exports.previewAlert = async (payload) => {
  const region = normalizeRegion(payload);
  const farmers = await getTargetFarmers(region, payload.farmerIds || []);

  const recipients = farmers.map((farmer) => {
    const advisory = buildFarmerMessage(farmer, payload);
    const channels = buildChannelPlan(farmer, payload.channels || []);

    return {
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      city: farmer.city,
      cropType: farmer.cropType,
      language: advisory.language,
      channels,
      previewMessage: advisory.message
    };
  });

  const summary = recipients.reduce(
    (accumulator, recipient) => {
      accumulator.totalRecipients += 1;
      accumulator.byLanguage[recipient.language] = (accumulator.byLanguage[recipient.language] || 0) + 1;

      for (const channel of recipient.channels) {
        accumulator.byChannel[channel] = (accumulator.byChannel[channel] || 0) + 1;
      }

      return accumulator;
    },
    {
      region,
      totalRecipients: 0,
      byLanguage: { en: 0, hi: 0, mr: 0 },
      byChannel: { sms: 0, voice: 0, dashboard: 0 }
    }
  );

  return {
    mode: payload.messageMode || "ai",
    riskType: payload.riskType || "WEATHER",
    severity: payload.severity || "LOW",
    recommendation: payload.recommendation || "",
    customMessage: payload.customMessage || "",
    summary,
    recipients
  };
};

exports.getLanguagePreview = async (payload) => {
  const region = normalizeRegion(payload);
  const sampleName = payload.name || "Farmer";
  const sampleCrop = payload.cropType || "Crop";
  const languages = ["mr", "hi", "en"];

  return {
    region,
    mode: payload.messageMode || "ai",
    previews: languages.map((language) => {
      if (payload.messageMode === "custom") {
        return {
          language,
          message: payload.customMessage?.trim() || `Alert for ${region}`,
          recommendation: payload.recommendation || "Operator broadcast message"
        };
      }

      return advisoryService.buildAdvisory({
        name: sampleName,
        city: region,
        cropType: sampleCrop,
        riskType: payload.riskType || "WEATHER",
        severity: payload.severity || "LOW",
        language
      });
    })
  };
};

exports.processAlert = async (payload) => {
  const region = normalizeRegion(payload);
  const preview = await exports.previewAlert(payload);
  const farmers = await getTargetFarmers(region, payload.farmerIds || []);
  const results = [];

  if (!farmers.length) {
    const message = payload.customMessage?.trim() || `No active farmers found in ${region}, but the platform alert was generated.`;
    const alert = await Alert.create({
      region,
      city: region,
      farmerName: "Platform",
      language: advisoryService.normalizeLanguage(payload.language),
      channel: "dashboard",
      riskType: payload.riskType || "WEATHER",
      severity: payload.severity || "LOW",
      recommendation: payload.recommendation || "",
      message,
      status: "PLATFORM_ONLY"
    });

    global.io?.emit("new_alert", {
      id: alert.id,
      region,
      city: region,
      farmerName: "Platform",
      message,
      status: alert.status,
      createdAt: alert.createdAt
    });

    return { preview, deliveries: [alert] };
  }

  for (const farmer of farmers) {
    const advisory = buildFarmerMessage(farmer, payload);
    const channels = buildChannelPlan(farmer, payload.channels || []);

    for (const channel of channels) {
      try {
        let success = true;

        if (channel === "sms") {
          console.log(`[ALERT] Sending SMS to ${farmer.name} (${farmer.phone})`);
          success = await notificationService.sendSMS(farmer.phone, advisory.message);
        } else if (channel === "voice") {
          console.log(`[ALERT] Sending voice call to ${farmer.name} (${farmer.phone})`);
          success = await notificationService.sendVoiceCall(farmer.phone, advisory.message);
        }

        const alert = await Alert.create({
          region,
          city: farmer.city,
          farmerName: farmer.name,
          phone: farmer.phone,
          language: advisory.language,
          channel,
          riskType: payload.riskType || "WEATHER",
          severity: payload.severity || "LOW",
          recommendation: advisory.recommendation,
          message: advisory.message,
          status: success ? "SENT" : "FAILED"
        });

        global.io?.emit("new_alert", {
          id: alert.id,
          farmerName: farmer.name,
          phone: farmer.phone,
          message: advisory.message,
          region,
          city: farmer.city,
          channel,
          language: advisory.language,
          severity: alert.severity,
          status: alert.status,
          createdAt: alert.createdAt
        });

        results.push(alert);
      } catch (error) {
        console.error(`[ALERT] Failed for ${farmer.name} (${farmer.phone}) on ${channel}:`, error.message);
        const failedAlert = await Alert.create({
          region,
          city: farmer.city,
          farmerName: farmer.name,
          phone: farmer.phone,
          language: advisory.language,
          channel,
          riskType: payload.riskType || "WEATHER",
          severity: payload.severity || "LOW",
          recommendation: advisory.recommendation,
          message: advisory.message,
          status: "FAILED"
        });

        results.push(failedAlert);
      }
    }
  }

  return { preview, deliveries: results };
};

exports.getAlerts = async ({ region } = {}) => {
  const where = {};

  if (region?.trim()) {
    where.region = region.trim();
  }

  return await Alert.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: 50
  });
};

const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "..", "config", "provider-settings.json");

const defaultSettings = {
  notificationMode: process.env.NOTIFICATION_MODE || "mock",
  smsProvider: process.env.SMS_PROVIDER || "mock",
  voiceProvider: process.env.VOICE_PROVIDER || "mock",
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || "",
  voiceWebhookUrl: process.env.VOICE_WEBHOOK_URL || "",
  senderName: "AgroAI Weather"
};

const ensureSettingsFile = () => {
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
  }
};

exports.getProviderSettings = () => {
  ensureSettingsFile();
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    return {
      ...defaultSettings,
      ...JSON.parse(raw)
    };
  } catch (error) {
    return defaultSettings;
  }
};

exports.saveProviderSettings = (payload) => {
  const nextSettings = {
    ...exports.getProviderSettings(),
    notificationMode: payload.notificationMode || "mock",
    smsProvider: payload.smsProvider || "mock",
    voiceProvider: payload.voiceProvider || "mock",
    smsWebhookUrl: payload.smsWebhookUrl || "",
    voiceWebhookUrl: payload.voiceWebhookUrl || "",
    senderName: payload.senderName || "AgroAI Weather"
  };

  fs.writeFileSync(settingsPath, JSON.stringify(nextSettings, null, 2));
  return nextSettings;
};

const { getProviderSettings } = require("./settings.service");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTwilioConfig = (settings = getProviderSettings()) => ({
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || settings.twilioAccountSid,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || settings.twilioAuthToken,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || settings.twilioPhoneNumber
});

exports.warnIfTwilioLooksMisconfigured = (sampleRecipientPhone = "") => {
  const settings = getProviderSettings();
  const { twilioPhoneNumber } = getTwilioConfig(settings);

  if (settings.voiceProvider !== "twilio") {
    return;
  }

  if (!twilioPhoneNumber) {
    console.warn("[TWILIO] WARNING: TWILIO_PHONE_NUMBER is missing.");
    return;
  }

  if (sampleRecipientPhone && twilioPhoneNumber === sampleRecipientPhone) {
    console.warn("[TWILIO] WARNING: TWILIO_PHONE_NUMBER matches the recipient phone number.");
    console.warn("[TWILIO] Caller ID must be your Twilio number, not the farmer/test number.");
  }
};

const postJson = async (url, payload) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? await response.json() : await response.text();
};

const runMockSms = async (phone, message, senderName) => {
  console.log("MOCK SMS SENT");
  console.log("Sender:", senderName);
  console.log("To:", phone);
  console.log("Message:", message);
  await sleep(250);
  return Math.random() > 0.08;
};

const runMockVoice = async (phone, message, voiceProvider) => {
  console.log("MOCK VOICE CALL");
  console.log("Provider:", voiceProvider);
  console.log("To:", phone);
  console.log("Voice Script:", message);
  await sleep(350);
  return Math.random() > 0.12;
};

const callWithTwilio = async (settings, phone, message) => {
  const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = getTwilioConfig(settings);

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error("Twilio settings are incomplete");
  }

  if (twilioPhoneNumber === phone) {
    throw new Error("Twilio caller number matches recipient number. Use your Twilio number as caller ID.");
  }

  console.log("[TWILIO] Initiating voice call");
  console.log("[TWILIO] From:", twilioPhoneNumber);
  console.log("[TWILIO] To:", phone);
  console.log("[TWILIO] Message:", message);

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
  const params = new URLSearchParams({
    To: phone,
    From: twilioPhoneNumber,
    Twiml: `<Response><Say>${message}</Say></Response>`
  });

  const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio call failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log("[TWILIO] Call accepted");
  console.log("[TWILIO] Call SID:", data.sid);
  console.log("[TWILIO] Status:", data.status);

  return true;
};

exports.sendSMS = async (phone, message) => {
  const settings = getProviderSettings();
  console.log("[SMS] Request");
  console.log("[SMS] To:", phone);

  if (settings.notificationMode === "webhook") {
    if (!settings.smsWebhookUrl) {
      throw new Error("SMS webhook URL is missing");
    }

    await postJson(settings.smsWebhookUrl, {
      channel: "sms",
      senderName: settings.senderName,
      phone,
      message
    });

    return true;
  }

  return await runMockSms(phone, message, settings.senderName);
};

exports.sendVoiceCall = async (phone, message) => {
  const settings = getProviderSettings();
  console.log("[VOICE] Request");
  console.log("[VOICE] Provider:", settings.voiceProvider);
  console.log("[VOICE] To:", phone);

  if (settings.voiceProvider === "twilio") {
    exports.warnIfTwilioLooksMisconfigured(phone);
    return await callWithTwilio(settings, phone, message);
  }

  if (settings.notificationMode === "webhook") {
    if (!settings.voiceWebhookUrl) {
      throw new Error("Voice webhook URL is missing");
    }

    await postJson(settings.voiceWebhookUrl, {
      channel: "voice",
      provider: settings.voiceProvider,
      senderName: settings.senderName,
      phone,
      message
    });

    return true;
  }

  return await runMockVoice(phone, message, settings.voiceProvider);
};

exports.testVoiceCall = async (phone, message) => {
  if (!phone?.trim()) {
    throw new Error("Test phone number is required");
  }

  const finalMessage = message?.trim() || "This is a test voice call from AgroAI Weather.";
  await exports.sendVoiceCall(phone.trim(), finalMessage);
  return {
    channel: "voice",
    phone: phone.trim(),
    message: finalMessage,
    status: "initiated"
  };
};

exports.testSMS = async (phone, message) => {
  if (!phone?.trim()) {
    throw new Error("Test phone number is required");
  }

  const finalMessage = message?.trim() || "This is a test SMS from AgroAI Weather.";
  await exports.sendSMS(phone.trim(), finalMessage);
  return {
    channel: "sms",
    phone: phone.trim(),
    message: finalMessage,
    status: "initiated"
  };
};

const languageLabels = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi"
};

const recommendationMap = {
  NORMAL: {
    en: "Weather is stable. Continue regular field monitoring.",
    hi: "मौसम सामान्य है। नियमित रूप से खेत की निगरानी जारी रखें।",
    mr: "हवामान स्थिर आहे. शेताची नियमित पाहणी सुरू ठेवा."
  },
  FLOOD: {
    en: "Heavy rain risk. Protect harvested crop, clear drainage, and move equipment to higher ground.",
    hi: "तेज बारिश का खतरा है। कटी फसल को सुरक्षित रखें, पानी की निकासी साफ करें और उपकरण ऊंची जगह पर रखें।",
    mr: "मुसळधार पावसाचा धोका आहे. कापलेले पीक सुरक्षित ठेवा, निचरा मोकळा ठेवा आणि साधने उंच जागी हलवा."
  },
  DROUGHT: {
    en: "Dry heat stress likely. Prioritize irrigation, mulch exposed soil, and avoid daytime spraying.",
    hi: "सूखा और गर्मी का दबाव संभव है। सिंचाई को प्राथमिकता दें, मिट्टी ढकें और दोपहर में छिड़काव न करें।",
    mr: "दुष्काळ आणि उष्णतेचा ताण संभवतो. सिंचनाला प्राधान्य द्या, मोकळी जमीन झाका आणि दुपारी फवारणी टाळा."
  },
  STORM: {
    en: "Storm conditions possible. Secure inputs, delay spraying, and keep workers away from open fields.",
    hi: "तूफान की संभावना है। सामग्री सुरक्षित रखें, छिड़काव टालें और मजदूरों को खुले खेत से दूर रखें।",
    mr: "वादळी हवामानाची शक्यता आहे. साहित्य सुरक्षित ठेवा, फवारणी पुढे ढकला आणि कामगारांना मोकळ्या शेतापासून दूर ठेवा."
  }
};

const introTemplates = {
  en: ({ name, city }) => `Farmer ${name}, alert for ${city}.`,
  hi: ({ name, city }) => `किसान ${name}, ${city} के लिए चेतावनी।`,
  mr: ({ name, city }) => `शेतकरी ${name}, ${city} साठी इशारा.`
};

const channelTemplates = {
  en: { sms: "SMS", voice: "Voice Call" },
  hi: { sms: "एसएमएस", voice: "वॉइस कॉल" },
  mr: { sms: "एसएमएस", voice: "व्हॉइस कॉल" }
};

const normalizeLanguage = (language) => {
  if (!language) return "en";
  const value = language.toLowerCase();
  if (value.startsWith("mr") || value.includes("marathi")) return "mr";
  if (value.startsWith("hi") || value.includes("hindi")) return "hi";
  return "en";
};

exports.normalizeLanguage = normalizeLanguage;

exports.getLanguageLabel = (language) => languageLabels[normalizeLanguage(language)] || "English";

exports.buildAdvisory = ({ name, city, cropType, riskType, severity, language }) => {
  const normalizedLanguage = normalizeLanguage(language);
  const advisoryText =
    recommendationMap[riskType]?.[normalizedLanguage] || recommendationMap.NORMAL[normalizedLanguage];
  const cropLine = cropType
    ? normalizedLanguage === "mr"
      ? `${cropType} पिकासाठी विशेष काळजी घ्या.`
      : normalizedLanguage === "hi"
        ? `${cropType} फसल के लिए विशेष सावधानी रखें।`
        : `Take extra care for ${cropType}.`
    : "";

  const intro = introTemplates[normalizedLanguage]({ name, city });

  return {
    language: normalizedLanguage,
    recommendation: advisoryText,
    message: [intro, `${riskType} risk is ${severity}.`, advisoryText, cropLine]
      .filter(Boolean)
      .join(" ")
  };
};

exports.getChannelLabel = (language, channel) => {
  const normalizedLanguage = normalizeLanguage(language);
  return channelTemplates[normalizedLanguage]?.[channel] || channel;
};

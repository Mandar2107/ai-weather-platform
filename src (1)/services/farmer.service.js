const Farmer = require("../models/farmer.model");
const DEFAULT_TEST_PHONE = "+919686737219";

const normalizeLanguage = (language) => {
  if (!language) return "en";
  const value = language.toLowerCase();
  if (value.startsWith("mr") || value.includes("marathi")) return "mr";
  if (value.startsWith("hi") || value.includes("hindi")) return "hi";
  return "en";
};

const normalizeFarmerPayload = (data) => {
  const city = data.city?.trim() || data.region?.trim();

  if (!data.name?.trim() || !data.phone?.trim() || !city) {
    throw new Error("Name, phone, and city are required");
  }

  return {
    name: data.name.trim(),
    phone: DEFAULT_TEST_PHONE,
    city,
    region: city,
    village: data.village?.trim() || "",
    taluka: data.taluka?.trim() || "",
    district: data.district?.trim() || "",
    state: data.state?.trim() || "Maharashtra",
    cropType: data.cropType?.trim() || "",
    landSizeAcres: Number(data.landSizeAcres || 0),
    irrigationType: data.irrigationType?.trim() || "",
    language: normalizeLanguage(data.language),
    smsEnabled: data.smsEnabled !== false,
    voiceEnabled: Boolean(data.voiceEnabled),
    whatsappEnabled: Boolean(data.whatsappEnabled),
    active: data.active !== false,
    notes: data.notes?.trim() || ""
  };
};

exports.createFarmer = async (data) => {
  return await Farmer.create(normalizeFarmerPayload(data));
};

exports.importFarmers = async (rows) => {
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error("Import rows are required");
  }

  const normalizedRows = rows.map((row) => normalizeFarmerPayload(row));
  return await Farmer.bulkCreate(normalizedRows);
};

exports.getFarmers = async (filters) => {
  const where = {};

  if (filters.region) where.region = filters.region.trim();
  if (filters.city) where.city = filters.city.trim();
  if (filters.cropType) where.cropType = filters.cropType.trim();
  if (filters.language) where.language = normalizeLanguage(filters.language);
  if (filters.active === "true") where.active = true;
  if (filters.active === "false") where.active = false;

  return await Farmer.findAll({
    where,
    order: [["createdAt", "DESC"]]
  });
};

exports.getFarmerSummary = async () => {
  const farmers = await Farmer.findAll();
  const summary = {
    totalFarmers: farmers.length,
    activeFarmers: farmers.filter((farmer) => farmer.active).length,
    smsSubscribers: farmers.filter((farmer) => farmer.smsEnabled).length,
    voiceSubscribers: farmers.filter((farmer) => farmer.voiceEnabled).length,
    byLanguage: { en: 0, hi: 0, mr: 0 },
    byCity: {}
  };

  for (const farmer of farmers) {
    summary.byLanguage[farmer.language] = (summary.byLanguage[farmer.language] || 0) + 1;
    summary.byCity[farmer.city] = (summary.byCity[farmer.city] || 0) + 1;
  }

  return summary;
};

exports.deleteFarmer = async (id) => {
  return await Farmer.destroy({ where: { id } });
};

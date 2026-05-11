import SiteSetting from "../models/SiteSetting.js";

const getOrCreate = async () => {
  let setting = await SiteSetting.findOne();
  if (!setting) {
    setting = await SiteSetting.create({});
  }
  return setting;
};

export const getSiteSettings = async (_req, res) => {
  try {
    const setting = await getOrCreate();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSiteSettings = async (req, res) => {
  try {
    const setting = await getOrCreate();
    Object.assign(setting, req.body);
    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

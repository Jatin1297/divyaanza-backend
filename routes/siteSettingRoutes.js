import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { getSiteSettings, updateSiteSettings } from "../controllers/siteSettingController.js";

const router = express.Router();

router.get("/", getSiteSettings);
router.patch("/", adminAuth, updateSiteSettings);

export default router;

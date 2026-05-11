import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { assignAwbForOrder, createShipmentForOrder, trackAwb } from "../controllers/shiprocketController.js";

const router = express.Router();

// Admin-only helpers
router.post("/order/:id/create", adminAuth, createShipmentForOrder);
router.post("/order/:id/assign-awb", adminAuth, express.json(), assignAwbForOrder);

// Tracking can be public or admin-only; keeping public for convenience.
router.get("/track/:awb", trackAwb);

export default router;


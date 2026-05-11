import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";
import {
  createTestimonial,
  deleteTestimonial,
  getAdminTestimonials,
  getTestimonials,
  updateTestimonial,
} from "../controllers/testimonialController.js";

const router = express.Router();

router.get("/", getTestimonials);
router.get("/admin", adminAuth, getAdminTestimonials);
router.post("/", adminAuth, upload.single("image"), createTestimonial);
router.patch("/:id", adminAuth, upload.single("image"), updateTestimonial);
router.delete("/:id", adminAuth, deleteTestimonial);

export default router;

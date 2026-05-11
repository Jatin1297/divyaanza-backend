import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  createEnquiry,
  deleteEnquiry,
  getEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiryController.js";

const router = express.Router();

router.post("/", createEnquiry);
router.get("/", adminAuth, getEnquiries);
router.patch("/:id", adminAuth, updateEnquiryStatus);
router.delete("/:id", adminAuth, deleteEnquiry);

export default router;

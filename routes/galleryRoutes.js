import express from "express";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItems,
  updateGalleryItem,
} from "../controllers/galleryController.js";

const router = express.Router();

router.get("/", getGalleryItems);
router.post("/", adminAuth, upload.single("image"), createGalleryItem);
router.patch("/:id", adminAuth, updateGalleryItem);
router.delete("/:id", adminAuth, deleteGalleryItem);

export default router;

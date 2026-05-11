import express from "express";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.post("/", adminAuth, upload.single("image"), createCategory);
router.get("/", getCategories);
router.patch("/:id", adminAuth, upload.single("image"), updateCategory);
router.delete("/:id", adminAuth, deleteCategory);

export default router;

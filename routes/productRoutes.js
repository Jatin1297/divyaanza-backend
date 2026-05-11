import express from "express";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  createProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", adminAuth, upload.array("images", 6), createProduct);
router.get("/", getProducts);
router.patch("/:id", adminAuth, upload.array("images", 6), updateProduct);
router.delete("/:id", adminAuth, deleteProduct);

export default router;

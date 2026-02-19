import express from "express";
import upload from "../middleware/upload.js";
import {
  createProduct,
  getProducts,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", upload.array("images", 6), createProduct);
router.get("/", getProducts);
router.delete("/:id", deleteProduct);

export default router;

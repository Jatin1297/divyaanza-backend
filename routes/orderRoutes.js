import express from "express";
import {
  cancelMyOrder,
  createRazorpayOrder,
  getAdminOrders,
  getMyOrders,
  placeOrder,
  verifyRazorpayPayment,
  updateOrderStatus,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/", userAuth, placeOrder);
router.post("/razorpay/create-order", userAuth, createRazorpayOrder);
router.post("/razorpay/verify", userAuth, verifyRazorpayPayment);
router.get("/my", userAuth, getMyOrders);
router.patch("/my/:id/cancel", userAuth, cancelMyOrder);
router.get("/admin", adminAuth, getAdminOrders);
router.patch("/:id/status", adminAuth, updateOrderStatus);

export default router;

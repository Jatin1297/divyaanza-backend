import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import productRoutes from "./routes/productRoutes.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import { razorpayWebhook } from "./controllers/orderController.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import siteSettingRoutes from "./routes/siteSettingRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import shiprocketRoutes from "./routes/shiprocketRoutes.js";





dotenv.config();

/* CLOUDINARY */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5050;

/* MIDDLEWARE */
app.use(cors());
app.post("/api/orders/webhook/razorpay", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json());

/* ROUTES */
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/settings", siteSettingRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/shiprocket", shiprocketRoutes);

/* TEST */
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

/* DB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch(console.log);

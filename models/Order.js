import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    shippingAddress: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "Card"],
      default: "COD",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
      required: true,
    },
    paymentReference: { type: String, default: "", trim: true },
    razorpayOrderId: { type: String, default: "", trim: true, index: true },
    razorpayPaymentId: { type: String, default: "", trim: true },
    paymentSignature: { type: String, default: "", trim: true },
    paymentVerifiedAt: { type: Date, default: null },

    // Shiprocket integration
    shiprocketOrderId: { type: Number, default: null },
    shiprocketShipmentId: { type: Number, default: null },
    shiprocketAwbCode: { type: String, default: "", trim: true },
    shiprocketCourierName: { type: String, default: "", trim: true },
    shiprocketTrackingUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sendMail } from "../utils/mailer.js";

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

/** Normalise line items for API responses (names/images if legacy data or deleted products). */
const formatOrderResponse = (order) => {
  if (!order) return order;
  const o =
    typeof order.toObject === "function"
      ? order.toObject({ flattenMaps: true })
      : { ...order };
  o.items = (o.items || []).map((item) => {
    const prod = item.product;
    const pname = prod && typeof prod === "object" ? prod.name : null;
    const pimg =
      prod && typeof prod === "object" && Array.isArray(prod.images) ? prod.images[0] : null;
    return {
      ...item,
      displayName: item.name || pname || "Product",
      displayImage: item.image || pimg || "",
    };
  });
  return o;
};

const buildOrderItems = async (items) => {
  const productIds = [
    ...new Set(
      items
        .map((item) => {
          const raw = item.productId ?? item.product ?? item._id;
          return raw != null ? String(raw) : "";
        })
        .filter(Boolean)
    ),
  ];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let totalAmount = 0;
  let totalQuantity = 0;
  let totalWeight = 0;

  for (const item of items) {
    const raw = item.productId ?? item.product ?? item._id;
    const pid = raw != null ? String(raw) : "";
    const product = productMap.get(pid);
    const quantity = Number(item.quantity || 1);
    if (!product || quantity < 1) {
      throw new Error("Invalid item in order");
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || "",
      price: product.price,
      weight: Number(product.weight || 0),
      quantity,
    });
    totalAmount += product.price * quantity;
    totalQuantity += quantity;
    totalWeight += Number(product.weight || 0) * quantity;
  }

  return { orderItems, totalAmount, totalQuantity, totalWeight };
};

const calculatePricing = (subtotal, totalQuantity, totalWeight) => {
  const gstAmount = Math.round(subtotal * 0.05);
  let deliveryCharge = 0;
  if (totalQuantity > 10) {
    deliveryCharge = 0;
  } else if (totalWeight < 40) {
    deliveryCharge = 40;
  } else {
    deliveryCharge = totalQuantity * 80;
  }
  const totalAmount = subtotal + gstAmount + deliveryCharge;
  return { subtotal, gstAmount, deliveryCharge, totalAmount };
};

const sendOrderPlacedMail = async (user, order) => {
  if (!user?.email) return;
  const itemLines = (order.items || [])
    .map((item) => `- ${item.name} x ${item.quantity} (₹${item.price})`)
    .join("\n");
  await sendMail({
    to: user.email,
    subject: `Order Placed - ${order._id}`,
    text: `Hi ${user.name || "Customer"},\n\nYour order has been placed successfully.\nOrder ID: ${order._id}\nPayment: ${order.paymentMethod} (${order.paymentStatus})\nTotal: ₹${order.totalAmount}\n\nItems:\n${itemLines}\n\nThanks,\nDivyaanza Stitch`,
  });
};

const sendOrderStatusMail = async (user, order) => {
  if (!user?.email) return;
  await sendMail({
    to: user.email,
    subject: `Order Status Update - ${order._id}`,
    text: `Hi ${user.name || "Customer"},\n\nYour order status is now: ${order.status}\nOrder ID: ${order._id}\nPayment: ${order.paymentMethod} (${order.paymentStatus})\n\nThanks,\nDivyaanza Stitch`,
  });
};

export const placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, phone, paymentMethod } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Order items are required" });
    }
    if (!shippingAddress || !phone) {
      return res.status(400).json({ message: "Shipping address and phone are required" });
    }
    const allowedPaymentMethods = ["COD", "UPI", "Card"];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    if (paymentMethod !== "COD") {
      return res.status(400).json({ message: "Use Razorpay checkout for online payments" });
    }

    const { orderItems, totalAmount: itemTotal, totalQuantity, totalWeight } = await buildOrderItems(items);
    const { subtotal, gstAmount, deliveryCharge, totalAmount } = calculatePricing(
      itemTotal,
      totalQuantity,
      totalWeight
    );

    const order = await Order.create({
      user: req.user.userId,
      items: orderItems,
      subtotal,
      gstAmount,
      deliveryCharge,
      totalAmount,
      shippingAddress,
      phone,
      paymentMethod,
      paymentStatus: "Pending",
    });

    await User.findByIdAndUpdate(req.user.userId, {
      phone,
      address: shippingAddress,
    });

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name images");

    try {
      await sendOrderPlacedMail(populated.user, populated);
    } catch (mailErr) {
      console.log("Order placed email failed:", mailErr.message);
    }

    res.status(201).json(formatOrderResponse(populated));
  } catch (err) {
    const code = err.message === "Invalid item in order" ? 400 : 500;
    res.status(code).json({ message: err.message });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay is not configured" });
    }

    const { items, shippingAddress, phone, paymentMethod } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Order items are required" });
    }
    if (!shippingAddress || !phone) {
      return res.status(400).json({ message: "Shipping address and phone are required" });
    }
    if (!["UPI", "Card"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Online payment requires UPI or Card method" });
    }

    const { orderItems, totalAmount: itemTotal, totalQuantity, totalWeight } = await buildOrderItems(items);
    const { subtotal, gstAmount, deliveryCharge, totalAmount } = calculatePricing(
      itemTotal,
      totalQuantity,
      totalWeight
    );
    const localOrder = await Order.create({
      user: req.user.userId,
      items: orderItems,
      subtotal,
      gstAmount,
      deliveryCharge,
      totalAmount,
      shippingAddress,
      phone,
      paymentMethod,
      paymentStatus: "Pending",
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `order_${localOrder._id.toString().slice(-10)}`,
      notes: {
        localOrderId: localOrder._id.toString(),
        userId: req.user.userId,
      },
    });

    localOrder.razorpayOrderId = razorpayOrder.id;
    await localOrder.save();

    await User.findByIdAndUpdate(req.user.userId, { phone, address: shippingAddress });

    res.status(201).json({
      key: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      localOrderId: localOrder._id,
    });
  } catch (err) {
    const code = err.message === "Invalid item in order" ? 400 : 500;
    res.status(code).json({ message: err.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !localOrderId) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const order = await Order.findOne({
      _id: localOrderId,
      user: req.user.userId,
      razorpayOrderId: razorpay_order_id,
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found for verification" });
    }

    order.paymentStatus = "Paid";
    order.paymentReference = razorpay_payment_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentSignature = razorpay_signature;
    order.paymentVerifiedAt = new Date();
    await order.save();

    const populated = await Order.findById(order._id).populate("user", "name email");
    try {
      await sendOrderPlacedMail(populated.user, populated);
    } catch (mailErr) {
      console.log("Razorpay verify mail failed:", mailErr.message);
    }

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
      .update(body)
      .digest("hex");

    if (!signature || expected !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(body.toString("utf8"));
    const paymentEntity = event?.payload?.payment?.entity;
    if (!paymentEntity) {
      return res.status(200).json({ received: true });
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const updated = await Order.findOneAndUpdate(
        { razorpayOrderId },
        {
          paymentStatus: "Paid",
          paymentReference: razorpayPaymentId || "",
          razorpayPaymentId: razorpayPaymentId || "",
          paymentVerifiedAt: new Date(),
        },
        { new: true }
      ).populate("user", "name email");
      if (updated?.user?.email) {
        try {
          await sendOrderPlacedMail(updated.user, updated);
        } catch (mailErr) {
          console.log("Webhook mail failed:", mailErr.message);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name images");
    res.json(orders.map((doc) => formatOrderResponse(doc)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.userId }).populate(
      "user",
      "name email"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (["Shipped", "Delivered", "Cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "This order cannot be cancelled" });
    }
    order.status = "Cancelled";
    await order.save();

    const refreshed = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name images");

    try {
      await sendOrderStatusMail(refreshed.user, refreshed);
    } catch (mailErr) {
      console.log("Cancel order mail failed:", mailErr.message);
    }

    res.json(formatOrderResponse(refreshed));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminOrders = async (_req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("items.product", "name images");
    res.json(orders.map((doc) => formatOrderResponse(doc)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("user", "name email")
      .populate("items.product", "name images");

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    try {
      await sendOrderStatusMail(updated.user, updated);
    } catch (mailErr) {
      console.log("Order status mail failed:", mailErr.message);
    }

    res.json(formatOrderResponse(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

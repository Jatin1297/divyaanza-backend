import Order from "../models/Order.js";
import { shiprocketAssignAwb, shiprocketCreateAdhocOrder, shiprocketTrackAwb } from "../utils/shiprocket.js";

const safeStr = (v) => String(v ?? "").trim();
const extractPincode = (address) => {
  const m = String(address || "").match(/\b(\d{6})\b/);
  return m ? m[1] : "";
};

// Create Shiprocket shipment for a local order (admin-only).
export const createShipmentForOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // If already created, return current fields.
    if (order.shiprocketShipmentId) {
      return res.json(order);
    }

    const billingName = safeStr(order.user?.name) || "Customer";
    const billingEmail = safeStr(order.user?.email) || "support@example.com";
    const billingPhone = safeStr(order.phone) || "0000000000";

    const items = (order.items || []).map((it) => ({
      name: safeStr(it.name) || "Product",
      sku: safeStr(it.product) || safeStr(it.name) || "SKU",
      units: Number(it.quantity || 1),
      selling_price: Number(it.price || 0),
      // Shiprocket expects grams in many setups; we store "weight" as number.
      // If your account expects KG, adjust this conversion.
      weight: Number(it.weight || 0),
    }));

    const payload = {
      order_id: order._id.toString(),
      order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 19).replace("T", " "),
      pickup_location: safeStr(process.env.SHIPROCKET_PICKUP_LOCATION || "Primary"),
      billing_customer_name: billingName,
      billing_last_name: "",
      billing_address: safeStr(order.shippingAddress),
      billing_address_2: "",
      billing_city: safeStr(process.env.SHIPROCKET_DEFAULT_CITY || "Delhi"),
      billing_pincode:
        extractPincode(order.shippingAddress) ||
        safeStr(process.env.SHIPROCKET_DEFAULT_PINCODE || "110054"),
      billing_state: safeStr(process.env.SHIPROCKET_DEFAULT_STATE || "Delhi"),
      billing_country: "India",
      billing_email: billingEmail,
      billing_phone: billingPhone,
      shipping_is_billing: true,
      order_items: items,
      payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: Number(order.subtotal || order.totalAmount || 0),
      length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 10),
      breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH || 10),
      height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 5),
      weight: Number(
        (order.items || []).reduce((sum, it) => sum + Number(it.weight || 0) * Number(it.quantity || 1), 0)
      ),
    };

    const created = await shiprocketCreateAdhocOrder(payload);

    order.shiprocketOrderId = created?.order_id ?? order.shiprocketOrderId ?? null;
    order.shiprocketShipmentId = created?.shipment_id ?? order.shiprocketShipmentId ?? null;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignAwbForOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_id } = req.body || {};

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.shiprocketShipmentId) {
      return res.status(400).json({ message: "Create Shiprocket shipment first" });
    }

    const result = await shiprocketAssignAwb({
      shipment_id: order.shiprocketShipmentId,
      courier_id: courier_id ? Number(courier_id) : undefined,
    });

    order.shiprocketAwbCode = safeStr(result?.awb_code || result?.awb || "");
    order.shiprocketCourierName = safeStr(result?.courier_name || "");
    await order.save();

    res.json({ order, result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const trackAwb = async (req, res) => {
  try {
    const { awb } = req.params;
    const data = await shiprocketTrackAwb(awb);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


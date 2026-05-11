import User from "../models/User.js";
import Order from "../models/Order.js";

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
    const orders = await Order.find().select("user totalAmount");

    const orderStats = new Map();
    for (const order of orders) {
      const key = order.user?.toString();
      if (!key) continue;
      const current = orderStats.get(key) || { ordersCount: 0, spent: 0 };
      current.ordersCount += 1;
      current.spent += Number(order.totalAmount || 0);
      orderStats.set(key, current);
    }

    const payload = users.map((user) => {
      const stats = orderStats.get(user._id.toString()) || { ordersCount: 0, spent: 0 };
      return { ...user.toObject(), ...stats };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

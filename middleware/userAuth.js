import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default userAuth;

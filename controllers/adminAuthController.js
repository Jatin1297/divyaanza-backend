export const loginAdmin = async (req, res) => {

  console.log("ENV EMAIL:", process.env.ADMIN_EMAIL);
  console.log("ENV PASSWORD:", process.env.ADMIN_PASSWORD);

  console.log("BODY:", req.body);

  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    success: true,
    token,
  });
};
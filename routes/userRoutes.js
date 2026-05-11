import express from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  signupUser,
} from "../controllers/userAuthController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", userAuth, getCurrentUser);

export default router;

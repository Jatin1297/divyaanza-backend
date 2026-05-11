import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { getAllUsers, updateUserByAdmin } from "../controllers/adminUserController.js";

const router = express.Router();

router.get("/", adminAuth, getAllUsers);
router.patch("/:id", adminAuth, updateUserByAdmin);

export default router;

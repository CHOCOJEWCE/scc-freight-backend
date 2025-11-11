// routes/testRoutes.js
import express from "express";
import { protect, verifyRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🚛 Protected test route
router.get("/secure-test", protect, verifyRole("admin", "dispatcher"), (req, res) => {
  res.json({
    message: `Welcome, ${req.user.name}! You have access as a ${req.user.role}.`,
  });
});

export default router;

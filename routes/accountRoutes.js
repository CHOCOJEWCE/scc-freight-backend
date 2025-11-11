// routes/accountRoutes.js
import express from "express";
import { protect, verifyRole } from "../middleware/authMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

// ✅ Example route — Admin-only
router.get("/admin/users", protect, verifyRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      message: "Admin access granted",
      total: users.length,
      users,
    });
  } catch (err) {
    console.error("Admin route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Example route — Dispatcher + Admin
router.get("/dispatcher/overview", protect, verifyRole("dispatcher", "admin"), (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}, you have dispatcher/admin access.`,
  });
});

// ✅ Example route — Carrier
router.get("/carrier/dashboard", protect, verifyRole("carrier"), (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}, this is your carrier dashboard.`,
  });
});

// ✅ Example route — Shipper
router.get("/shipper/dashboard", protect, verifyRole("shipper"), (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}, this is your shipper dashboard.`,
  });
});

export default router;

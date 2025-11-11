import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const router = express.Router();

// ====== Load Schema ======
const loadSchema = new mongoose.Schema(
  {
    shipperId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shipperName: { type: String },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    cargoType: { type: String, required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    pickupDate: { type: Date, required: true },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Load = mongoose.model("Load", loadSchema);

// ====== Auth Middleware ======
function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ====== Role Verification Middleware ======
function verifyRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

// ====== POST: Create a Load (Shipper Only) ======
router.post("/", protect, verifyRole("shipper"), async (req, res) => {
  try {
    const { origin, destination, cargoType, weight, price, pickupDate, deliveryDate } = req.body;

    const newLoad = new Load({
      shipperId: req.user.id,
      shipperName: req.user.email,
      origin,
      destination,
      cargoType,
      weight,
      price,
      pickupDate,
      deliveryDate,
    });

    await newLoad.save();
    res.status(201).json({
      message: "✅ Load posted successfully",
      load: newLoad,
    });
  } catch (error) {
    console.error("❌ Load creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ====== GET: All Loads (Dispatcher, Carrier, or Admin) ======
router.get("/", protect, verifyRole("dispatcher", "carrier", "admin"), async (req, res) => {
  try {
    const loads = await Load.find().populate("shipperId", "email name");
    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====== GET: Loads by Shipper ======
router.get("/my-loads", protect, verifyRole("shipper"), async (req, res) => {
  try {
    const loads = await Load.find({ shipperId: req.user.id });
    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====== PATCH: Update Load Status (Dispatcher/Admin Only) ======
router.patch("/:id/status", protect, verifyRole("dispatcher", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const load = await Load.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!load) return res.status(404).json({ message: "Load not found" });

    res.status(200).json({ message: "✅ Load status updated", load });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====== DELETE: Remove a Load (Shipper/Admin Only) ======
router.delete("/:id", protect, verifyRole("shipper", "admin"), async (req, res) => {
  try {
    const load = await Load.findByIdAndDelete(req.params.id);
    if (!load) return res.status(404).json({ message: "Load not found" });

    res.status(200).json({ message: "🗑️ Load deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

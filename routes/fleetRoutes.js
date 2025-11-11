// routes/fleetRoutes.js
import express from "express";
import Fleet from "../models/fleetModel.js";
import User from "../models/userModel.js";
import { protect, verifyRole } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/fleet/create
 * @desc Create a new fleet
 * @access Private (Admin, Dispatcher, or Owner)
 */
router.post("/create", protect, verifyRole("admin", "dispatcher"), async (req, res) => {
  try {
    const { fleetName, mcNumber } = req.body;

    const existing = await Fleet.findOne({ fleetName });
    if (existing) return res.status(400).json({ message: "Fleet name already exists." });

    const fleet = await Fleet.create({
      fleetName,
      owner: req.user._id,
      mcNumber,
      drivers: [req.user._id],
    });

    // Link owner to fleet
    await User.findByIdAndUpdate(req.user._id, { fleetId: fleet._id });

    res.status(201).json({ message: "Fleet created successfully.", fleet });
  } catch (err) {
    console.error("Create fleet error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route PUT /api/fleet/add-driver/:driverId
 * @desc Add driver to fleet
 * @access Private (Fleet Owner or Dispatcher)
 */
router.put("/add-driver/:driverId", protect, verifyRole("admin", "dispatcher"), async (req, res) => {
  try {
    const fleet = await Fleet.findOne({ owner: req.user._id });
    if (!fleet) return res.status(404).json({ message: "Fleet not found for this user." });

    const driver = await User.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    // Prevent duplicates
    if (fleet.drivers.includes(driver._id)) {
      return res.status(400).json({ message: "Driver already in fleet." });
    }

    fleet.drivers.push(driver._id);
    await fleet.save();

    await User.findByIdAndUpdate(driver._id, { fleetId: fleet._id });

    res.json({ message: "Driver added successfully.", fleet });
  } catch (err) {
    console.error("Add driver error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route PUT /api/fleet/remove-driver/:driverId
 * @desc Remove a driver from fleet
 * @access Private (Fleet Owner or Dispatcher)
 */
router.put("/remove-driver/:driverId", protect, verifyRole("admin", "dispatcher"), async (req, res) => {
  try {
    const fleet = await Fleet.findOne({ owner: req.user._id });
    if (!fleet) return res.status(404).json({ message: "Fleet not found for this user." });

    fleet.drivers = fleet.drivers.filter(id => id.toString() !== req.params.driverId);
    await fleet.save();

    await User.findByIdAndUpdate(req.params.driverId, { $unset: { fleetId: "" } });

    res.json({ message: "Driver removed successfully.", fleet });
  } catch (err) {
    console.error("Remove driver error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/fleet/my-fleet
 * @desc Get fleet info for logged-in user
 * @access Private
 */
router.get("/my-fleet", protect, async (req, res) => {
  try {
    const fleet = await Fleet.findOne({
      $or: [{ owner: req.user._id }, { drivers: req.user._id }],
    }).populate("owner drivers", "name email role");

    if (!fleet) return res.status(404).json({ message: "No fleet found for this user." });

    res.json(fleet);
  } catch (err) {
    console.error("My fleet error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/fleet/list
 * @desc Admin only — list all fleets
 * @access Private (Admin)
 */
router.get("/list", protect, verifyRole("admin"), async (req, res) => {
  try {
    const fleets = await Fleet.find()
      .populate("owner drivers", "name email role")
      .sort({ createdAt: -1 });
    res.json(fleets);
  } catch (err) {
    console.error("List fleets error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

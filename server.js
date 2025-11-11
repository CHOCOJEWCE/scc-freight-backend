// ===== Imports =====
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "./models/userModel.js";
import Token from "./models/tokenModel.js";
import sendEmail from "./utils/sendEmail.js";

// ✅ Import routes
import testRoutes from "./routes/testRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import fleetRoutes from "./routes/fleetRoutes.js";
import loadRoutes from "./routes/loadRoutes.js";

dotenv.config();

// ===== Initialize App =====
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ===== Connect to MongoDB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ===== Root Route =====
app.get("/", (req, res) => {
  res.send("SCC Freight API is running...");
});

// ===== REGISTER USER (with email verification) =====
app.post("/api/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyName,
      fleetSize,
      licenseNumber,
      yearsOfExperience,
      endorsements,
      cargoTypes,
      contactNumber,
      address,
      bio,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verified: false,
      companyName,
      fleetSize,
      licenseNumber,
      yearsOfExperience,
      endorsements,
      cargoTypes,
      contactNumber,
      address,
      bio,
    });

    await newUser.save();

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await new Token({ userId: newUser._id, token: verificationToken }).save();

    const verifyUrl = `http://localhost:5000/api/verify/${verificationToken}`;

    await sendEmail(
      newUser.email,
      "Verify your SCC Freight account",
      `<h2>Welcome to SCC Freight, ${newUser.name}!</h2>
       <p>Click the link below to verify your email:</p>
       <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
       <p>This link will expire in 1 hour.</p>`
    );

    res.status(201).json({
      message: `✅ User created successfully as ${role}. Please check your email to verify your account.`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===== VERIFY USER EMAIL =====
app.get("/api/verify/:token", async (req, res) => {
  try {
    const token = await Token.findOne({ token: req.params.token });
    if (!token) return res.status(400).send("❌ Invalid or expired token.");

    await User.updateOne({ _id: token.userId }, { verified: true });
    await Token.deleteOne({ _id: token._id });

    res.send("✅ Email verified successfully! You can now log in.");
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).send("❌ Server error during verification.");
  }
});

// ===== LOGIN USER =====
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.verified)
      return res
        .status(401)
        .json({ message: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DEV LOGIN (bypass password for testing) =====
app.post("/api/dev-login", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Dev login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Dev login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DEV ROLE CHANGE (for testing only) =====
app.put("/api/dev-role/:email", async (req, res) => {
  try {
    const { newRole } = req.body;
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { role: newRole },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `✅ Role updated to ${newRole}`, user });
  } catch (error) {
    console.error("Role change error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN VIEW: ALL USERS =====
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TEST EMAIL =====
app.get("/api/test-email", async (req, res) => {
  try {
    await sendEmail(
      "freightscc@gmail.com",
      "Test Email — SCC Freight",
      "<p>This is a manual test to confirm Gmail works.</p>"
    );
    res.send("✅ Test email sent (if no errors above)");
  } catch (err) {
    console.error("❌ Email test failed:", err);
    res.status(500).send("❌ Email test failed. Check console.");
  }
});

// ===== DEV VERIFY =====
app.put("/api/dev-verify/:email", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { verified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `${user.email} is now verified!`, user });
  } catch (err) {
    console.error("Dev verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== REGISTER ROUTES =====
app.use("/api/fleet", fleetRoutes);
app.use("/api/loads", loadRoutes);
app.use("/api", testRoutes);
app.use("/api/account", accountRoutes);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 SCC Freight Server running on port ${PORT}`)
);

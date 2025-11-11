import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    // 🔹 Role Management
    role: {
      type: String,
      enum: ["admin", "carrier", "dispatcher", "shipper", "fleet_owner"],
      default: "carrier",
    },

    // 🔹 Verification & Activity
    verified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔹 Company / Fleet Information
    companyName: { type: String, default: null },
    fleetSize: { type: Number, default: 0 },
    licenseNumber: { type: String, default: null },
    yearsOfExperience: { type: Number, default: 0 },
    endorsements: { type: [String], default: [] }, // e.g., Hazmat, Tanker
    cargoTypes: { type: [String], default: [] }, // e.g., Refrigerated, Flatbed
    credentialsVerified: { type: Boolean, default: false },

    // 🔹 Performance / Reputation System
    rating: { type: Number, default: 0 }, // 1–5 star average
    loadsCompleted: { type: Number, default: 0 },
    xp: { type: Number, default: 0 }, // Gamified progress tracker
    level: { type: String, default: "Bronze" }, // Bronze, Silver, Gold, Platinum

    // 🔹 Contact / Personalization
    contactNumber: { type: String, default: null },
    address: { type: String, default: null },
    profileImage: { type: String, default: null },
    bio: { type: String, default: "" }, // Social profile bio
    socialLinks: {
      type: Map,
      of: String, // { instagram: "url", linkedin: "url" }
      default: {},
    },

    // 🔹 Security / Metadata
    lastLogin: { type: Date },
    ipHistory: { type: [String], default: [] }, // Track IPs for abuse prevention
    deviceIDs: { type: [String], default: [] },

    // 🔹 Role Relationships (for future linkage)
    fleetOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // if this user works under a fleet owner
  },
  { timestamps: true }
);

// ✅ Auto-update XP level based on XP thresholds
userSchema.pre("save", function (next) {
  if (this.xp >= 10000) this.level = "Platinum";
  else if (this.xp >= 5000) this.level = "Gold";
  else if (this.xp >= 2000) this.level = "Silver";
  else this.level = "Bronze";
  next();
});

const User = mongoose.model("User", userSchema);
export default User;

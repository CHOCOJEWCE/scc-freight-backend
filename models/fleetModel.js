// models/fleetModel.js
import mongoose from "mongoose";

const fleetSchema = new mongoose.Schema(
  {
    fleetName: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mcNumber: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Fleet = mongoose.model("Fleet", fleetSchema);
export default Fleet;

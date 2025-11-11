import mongoose from "mongoose";

const loadSchema = new mongoose.Schema(
  {
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    carrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // until accepted by carrier
    },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    cargoType: { type: String, required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    pickupDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["posted", "assigned", "in_transit", "delivered", "cancelled"],
      default: "posted",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const Load = mongoose.model("Load", loadSchema);
export default Load;

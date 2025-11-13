import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    complaintByNgo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ngo",
      required: true,
    },
    againstHotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pickup",
      required: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    photoProof: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedByAdmin: {
      type: String,
      default: null,
      trim: true,
    },
    resolutionNote: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);


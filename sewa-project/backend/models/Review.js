import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pickup",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ngo",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      enum: ["timeliness", "quality", "hygiene", "spoiled", "other"],
      default: "other",
    },
    photoEvidenceUrl: {
      type: String,
      default: null,
    },
    foodQuality: {
      type: String,
      enum: ["excellent", "good", "average", "poor"],
    },
    packagingQuality: {
      type: String,
      enum: ["excellent", "good", "average", "poor"],
    },
    timeliness: {
      type: String,
      enum: ["on-time", "slightly-delayed", "very-delayed"],
    },
  },
  { timestamps: true }
);

// Index for faster queries
reviewSchema.index({ hotelId: 1, createdAt: -1 });
reviewSchema.index({ ngoId: 1, createdAt: -1 });
reviewSchema.index({ pickupId: 1 }, { unique: true }); // One review per pickup

export default mongoose.model("Review", reviewSchema);


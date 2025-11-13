import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
  hotelName: { type: String, required: true },
  managerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  city: { type: String },

  licenseDocument: { type: String, required: true},

  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },

  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  totalRatingsSum: {
    type: Number,
    default: 0,
  },
  negativeFeedbackCount: {
    type: Number,
    default: 0,
  },
  underReview: {
    type: Boolean,
    default: false,
  },
  underReviewReason: {
    type: String,
    default: null,
  },
  underReviewStartedAt: {
    type: Date,
    default: null,
  },
  isBlacklisted: {
    type: Boolean,
    default: false,
  },
  blacklistedAt: {
    type: Date,
    default: null,
  },
  blacklistReason: {
    type: String,
    default: null,
  },

}, { timestamps: true });

export default mongoose.model("Hotel", hotelSchema);

import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
  foodType: {
    type: String,
    required: true,
    enum: ["veg", "non-veg", "vegan"],
  },
  quantity: {
    type: Number,
    required: true,
  },
  servesPeople: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  preparedAt: {
    type: Date,
    required: true,
  },
  expectedShelfLife: {
    type: Number,
    default: 6,
  },

  // --- Expiry Tracking ---
  hotelExpiryAt: { type: Date, required: true }, 
  autoExpiryAt: { type: Date, required: true }, 
  expiryDifferenceHours: { type: Number, default: 0 },
  expiryMismatchWarning: { type: Boolean, default: false },

  expiryAt: { type: Date, required: true },

  pickupAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: false,
  },
  latitude: {
    type: Number,
    required: false,
  },
  longitude: {
    type: Number,
    required: false,
  },
  images: {
    type: [String],
    validate: [arrayLimit, "{PATH} exceeds the limit of 4"],
  },
  status: {
    type: String,
    enum: ["available", "taken", "expired", "picked-up"],
    default: "available",
  },
  pickedUpAt: {
    type: Date,
    default: null,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  acceptedByNgo: {
    type: String,
    default: null,
  },
  acceptedByNgoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ngo",
    default: null,
  },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ngo" }],
}, { timestamps: true });

function arrayLimit(val) {
  return val.length <= 4;
}

const Food = mongoose.model("Food", foodSchema);
export default Food;
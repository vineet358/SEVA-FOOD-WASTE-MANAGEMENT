import mongoose from "mongoose";

const ngoSchema = new mongoose.Schema({
  organizationName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  city: { type: String, required: true },

  licenseDocument: { type: String, required: true}, 

  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

export default mongoose.model("Ngo", ngoSchema);

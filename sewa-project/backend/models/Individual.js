import mongoose from "mongoose";
const individualSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true }
}, { timestamps: true });
const Individual = mongoose.model("Individual", individualSchema);
export default Individual;
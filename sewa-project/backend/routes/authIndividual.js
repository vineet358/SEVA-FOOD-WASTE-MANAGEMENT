// routes/authIndividual.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Individual from "../models/Individual.js";

const router = express.Router();
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    const existingUser = await Individual.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Individual already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Individual({ name, phone, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Individual signup successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Individual.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: "individual" }, "jwt_secret", { expiresIn: "1h" });

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Hotel from "../models/Hotel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendAdminNotification, sendVerificationEmail } from "../utils/emailService.js";

const router = express.Router();

// ---------- LICENSE UPLOAD SETUP ----------
const licenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/licenses";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const licenseFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, or PDF files are allowed"));
  }
  cb(null, true);
};

const uploadLicense = multer({ storage: licenseStorage, fileFilter: licenseFileFilter });

// ---------- ADMIN AUTH MIDDLEWARE ----------
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Admin token required" });

  try {
    const decoded = jwt.verify(token, "jwt_secret");
    if (decoded.role !== "admin") return res.status(403).json({ message: "Forbidden: Admins only" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ---------- HOTEL SIGNUP ----------
router.post("/signup", uploadLicense.single("license"), async (req, res) => {
  try {
    const { hotelName, managerName, address, city, licenseNumber, phone, email, password } = req.body;

    if (!hotelName || !managerName || !address || !licenseNumber || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingHotel = await Hotel.findOne({ email });
    if (existingHotel) return res.status(400).json({ message: "Hotel with this email already exists" });

    const existingLicense = await Hotel.findOne({ licenseNumber });
    if (existingLicense) return res.status(400).json({ message: "Hotel with this license number already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const hotel = new Hotel({
      hotelName,
      managerName,
      address,
      city: city || null,
      licenseNumber,
      phone,
      email,
      password: hashedPassword,
      licenseDocument: req.file ? req.file.path : null,
      verificationStatus: "pending"
    });

    await hotel.save();
    
    // Send email notification to admin
    try {
      await sendAdminNotification("Hotel", {
        hotelName: hotel.hotelName,
        managerName: hotel.managerName,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        city: hotel.city,
        licenseNumber: hotel.licenseNumber
      }, hotel.licenseDocument);
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }
    
    res.status(201).json({ 
      message: "Your registration has been processed. Once verified, we will email you.", 
      hotel: {
        id: hotel._id,
        hotelName: hotel.hotelName,
        email: hotel.email,
        verificationStatus: hotel.verificationStatus
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------- HOTEL LOGIN ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hotel = await Hotel.findOne({ email });
    if (!hotel) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, hotel.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Check if Hotel is verified
    if (hotel.verificationStatus !== "verified") {
      return res.status(403).json({ 
        message: "Your account is not yet verified. Please wait for admin verification.", 
        verificationStatus: hotel.verificationStatus 
      });
    }

    const token = jwt.sign({ id: hotel._id, role: "hotel" }, "jwt_secret", { expiresIn: "1h" });

    res.json({
      message: "Login successful",
      token,
      hotel: {
        hotelId: hotel._id,
        hotelName: hotel.hotelName,
        email: hotel.email,
        verificationStatus: hotel.verificationStatus
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ADMIN ROUTES ----------

// Get all pending hotels
router.get("/admin/pending", adminAuth, async (req, res) => {
  try {
    const hotels = await Hotel.find({ verificationStatus: "pending" }).select("-password");
    res.json({ pendingHotels: hotels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify or reject hotel
router.patch("/admin/verify/:id", adminAuth, async (req, res) => {
  try {
    const { action } = req.body; 
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    if (!["verify", "reject"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    hotel.verificationStatus = action === "verify" ? "verified" : "rejected";
    await hotel.save();
    
    // Send verification email to Hotel
    try {
      await sendVerificationEmail("Hotel", {
        hotelName: hotel.hotelName,
        managerName: hotel.managerName,
        email: hotel.email,
        licenseNumber: hotel.licenseNumber
      }, action);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }
    
    res.json({ message: `Hotel ${action}ed successfully`, hotel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Ngo from "../models/Ngo.js";
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

// ---------- NGO SIGNUP ----------
router.post("/signup", uploadLicense.single("license"), async (req, res) => {
  try {
    const { organizationName, contactPerson, address, licenseNumber, phone, email, password, city } = req.body;

    const existingNgo = await Ngo.findOne({ email });
    if (existingNgo) return res.status(400).json({ message: "NGO already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const ngo = new Ngo({
      organizationName,
      contactPerson,
      address,
      licenseNumber,
      phone,
      email,
      password: hashedPassword,
      city,
      licenseDocument: req.file ? req.file.path : null,
      verificationStatus: "pending"
    });

    await ngo.save();
    
    // Send email notification to admin
    try {
      await sendAdminNotification("NGO", {
        organizationName: ngo.organizationName,
        contactPerson: ngo.contactPerson,
        email: ngo.email,
        phone: ngo.phone,
        address: ngo.address,
        city: ngo.city,
        licenseNumber: ngo.licenseNumber
      }, ngo.licenseDocument);
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }
    
    res.status(201).json({ 
      message: "Your registration has been processed. Once verified, we will email you.", 
      ngo: {
        id: ngo._id,
        organizationName: ngo.organizationName,
        email: ngo.email,
        verificationStatus: ngo.verificationStatus
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NGO LOGIN ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const ngo = await Ngo.findOne({ email });
    if (!ngo) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, ngo.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Check if NGO is verified
    if (ngo.verificationStatus !== "verified") {
      return res.status(403).json({ 
        message: "Your account is not yet verified. Please wait for admin verification.", 
        verificationStatus: ngo.verificationStatus 
      });
    }

    const token = jwt.sign({ id: ngo._id, role: "ngo" }, "jwt_secret", { expiresIn: "1h" });

    res.json({
      message: "Login successful",
      token,
      ngo: {
        id: ngo._id,
        organizationName: ngo.organizationName,
        email: ngo.email,
        city: ngo.city
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ADMIN ROUTES ----------

// Get all pending NGOs
router.get("/admin/pending", adminAuth, async (req, res) => {
  try {
    const ngos = await Ngo.find({ verificationStatus: "pending" }).select("-password");
    res.json({ pendingNgos: ngos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify or reject NGO
router.patch("/admin/verify/:id", adminAuth, async (req, res) => {
  try {
    const { action } = req.body; 
    const ngo = await Ngo.findById(req.params.id);
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    if (!["verify", "reject"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    ngo.verificationStatus = action === "verify" ? "verified" : "rejected";
    await ngo.save();
    
    // Send verification email to NGO
    try {
      await sendVerificationEmail("NGO", {
        organizationName: ngo.organizationName,
        contactPerson: ngo.contactPerson,
        email: ngo.email,
        licenseNumber: ngo.licenseNumber
      }, action);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }
    
    res.json({ message: `NGO ${action}ed successfully`, ngo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

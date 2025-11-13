import express from "express";
import jwt from "jsonwebtoken";
import Ngo from "../models/Ngo.js";
import Hotel from "../models/Hotel.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import { getTopHotels, getTopNgos, getBlacklistedHotels, toggleBlacklist, getAdminDashboardStats, getPerformanceTrends, getHotelDetail } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

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

// Admin login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === "admin@sewa.com" && password === "admin123") {
      const token = jwt.sign({ id: "admin", role: "admin" }, "jwt_secret", { expiresIn: "24h" });
      res.json({
        message: "Admin login successful",
        token,
        admin: { id: "admin", email: "admin@sewa.com" }
      });
    } else {
      res.status(401).json({ message: "Invalid admin credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all pending registrations
router.get("/pending", adminAuth, async (req, res) => {
  try {
    const pendingNgos = await Ngo.find({ verificationStatus: "pending" }).select("-password");
    const pendingHotels = await Hotel.find({ verificationStatus: "pending" }).select("-password");
    
    res.json({
      pendingNgos,
      pendingHotels,
      total: pendingNgos.length + pendingHotels.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify NGO
router.patch("/verify/ngo/:id", adminAuth, async (req, res) => {
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

// Verify Hotel
router.patch("/verify/hotel/:id", adminAuth, async (req, res) => {
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

// Get all registrations (for admin dashboard)
router.get("/all", adminAuth, async (req, res) => {
  try {
    const ngos = await Ngo.find().select("-password").sort({ createdAt: -1 });
    const hotels = await Hotel.find().select("-password").sort({ createdAt: -1 });
    
    res.json({
      ngos,
      hotels,
      stats: {
        totalNgos: ngos.length,
        totalHotels: hotels.length,
        verifiedNgos: ngos.filter(n => n.verificationStatus === "verified").length,
        verifiedHotels: hotels.filter(h => h.verificationStatus === "verified").length,
        pendingNgos: ngos.filter(n => n.verificationStatus === "pending").length,
        pendingHotels: hotels.filter(h => h.verificationStatus === "pending").length,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/top-hotels", adminAuth, getTopHotels);
router.get("/top-ngos", adminAuth, getTopNgos);
router.get("/blacklisted-hotels", adminAuth, getBlacklistedHotels);
router.patch("/blacklist/:hotelId", adminAuth, toggleBlacklist);
router.get("/dashboard-stats", adminAuth, getAdminDashboardStats);
router.get("/performance-trends", adminAuth, getPerformanceTrends);
router.get("/hotel/:hotelId/detail", adminAuth, getHotelDetail);

export default router;
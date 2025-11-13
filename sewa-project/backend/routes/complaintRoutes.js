import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import {
  submitComplaint,
  getAllComplaints,
  getComplaintById,
  resolveComplaint,
} from "../controllers/complaintController.js";

const router = express.Router();

const complaintsDir = path.join("uploads", "complaint-photos");
if (!fs.existsSync(complaintsDir)) {
  fs.mkdirSync(complaintsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, complaintsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname) || ".jpg";
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Admin token required" });

  try {
    const decoded = jwt.verify(token, "jwt_secret");
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
};

router.post("/", upload.single("photoProof"), submitComplaint);
router.get("/", adminAuth, getAllComplaints);
router.get("/:complaintId", adminAuth, getComplaintById);
router.patch("/:complaintId/decision", adminAuth, resolveComplaint);

export default router;


import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  submitReview,
  getHotelReviews,
  getNgoReviews,
  getPendingReviews,
  getAllReviews,
  getReviewStats,
} from "../controllers/reviewController.js";

const router = express.Router();

const reviewPhotoDir = path.join("uploads", "review-photos");
if (!fs.existsSync(reviewPhotoDir)) {
  fs.mkdirSync(reviewPhotoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reviewPhotoDir);
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

router.post("/submit", upload.single("photoProof"), submitReview);
router.get("/hotel/:hotelId", getHotelReviews);
router.get("/ngo/:ngoId", getNgoReviews);
router.get("/ngo/:ngoId/pending", getPendingReviews);
router.get("/all", getAllReviews);
router.get("/stats", getReviewStats);

export default router;


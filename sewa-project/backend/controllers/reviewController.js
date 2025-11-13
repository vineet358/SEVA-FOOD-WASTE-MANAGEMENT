import Review from "../models/Review.js";
import Pickup from "../models/Pickup.js";
import Hotel from "../models/Hotel.js";
import Ngo from "../models/Ngo.js";
import Food from "../models/Food.js";
import { io } from "../server.js";

// ---------- SUBMIT REVIEW (NGO ONLY, AFTER OTP CONFIRMATION) ----------
export const submitReview = async (req, res) => {
  try {
    const {
      pickupId,
      rating,
      reviewText,
      foodQuality,
      packagingQuality,
      timeliness,
      reason,
    } = req.body;

    const ratingValue = Number(rating);

    if (!pickupId || !rating || !reviewText) {
      return res.status(400).json({
        message: "Missing required fields: pickupId, rating, and reviewText are required"
      });
    }

    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (ratingValue <= 3 && !reason) {
      return res.status(400).json({ message: "Please select a reason for ratings 3 or below." });
    }

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    if (!["picked-up", "confirmed"].includes(pickup.status)) {
      return res.status(400).json({
        message: "Cannot submit review. Pickup must be confirmed with OTP first."
      });
    }

    if (pickup.isReviewed) {
      return res.status(400).json({ message: "This donation has already been reviewed" });
    }

    const existingReview = await Review.findOne({ pickupId });
    if (existingReview) {
      return res.status(400).json({ message: "Review already exists for this pickup" });
    }

    const requiresPhotoEvidence =
      ratingValue <= 2 || (reason && reason.toLowerCase() === "spoiled");

    if (requiresPhotoEvidence && !req.file) {
      return res.status(400).json({
        message:
          "Photo evidence is required for low ratings or spoiled food issues. Please include a clear photo showing the hotel label.",
      });
    }

    const photoEvidenceUrl = req.file ? `/uploads/review-photos/${req.file.filename}` : null;

    const review = await Review.create({
      donationId: pickup.foodId,
      pickupId: pickup._id,
      hotelId: pickup.hotelId,
      ngoId: pickup.ngoId,
      rating: ratingValue,
      reviewText,
      reason: reason || "other",
      photoEvidenceUrl,
      foodQuality,
      packagingQuality,
      timeliness,
    });

    pickup.isReviewed = true;
    pickup.reviewedAt = new Date();
    await pickup.save();

    await updateHotelRating(pickup.hotelId, ratingValue);

    const populatedReview = await Review.findById(review._id)
      .populate("hotelId", "hotelName email phone")
      .populate("ngoId", "organizationName email phone")
      .populate("donationId", "foodType quantity");

    res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- UPDATE HOTEL RATING & BLACKLIST CHECK ----------
const updateHotelRating = async (hotelId, newRating) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return;

    const ratingValue = Number(newRating);
    if (Number.isNaN(ratingValue)) {
      console.warn(`Skipping hotel rating update for ${hotelId}: invalid rating`, newRating);
      return;
    }

    hotel.totalRatingsSum += ratingValue;
    hotel.totalReviews += 1;
    hotel.averageRating = hotel.totalRatingsSum / hotel.totalReviews;

    if (ratingValue <= 2) {
      hotel.negativeFeedbackCount += 1;
    }

    await hotel.save();

    console.log(`✅ Hotel ${hotel.hotelName} rating updated: ${hotel.averageRating.toFixed(2)} (${hotel.totalReviews} reviews)`);
  } catch (error) {
    console.error("Error updating hotel rating:", error);
  }
};

// ---------- GET REVIEWS FOR A SPECIFIC HOTEL ----------
export const getHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const reviews = await Review.find({ hotelId })
      .sort({ createdAt: -1 })
      .populate("ngoId", "organizationName email")
      .populate("donationId", "foodType quantity servesPeople");

    const hotel = await Hotel.findById(hotelId).select(
      "hotelName averageRating totalReviews negativeFeedbackCount isBlacklisted"
    );

    res.json({
      message: "Hotel reviews fetched successfully",
      hotel,
      reviews,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching hotel reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- GET REVIEWS BY NGO ----------
export const getNgoReviews = async (req, res) => {
  try {
    const { ngoId } = req.params;

    const reviews = await Review.find({ ngoId })
      .sort({ createdAt: -1 })
      .populate("hotelId", "hotelName email")
      .populate("donationId", "foodType quantity servesPeople");

    res.json({
      message: "NGO reviews fetched successfully",
      reviews,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching NGO reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- GET PENDING REVIEWS FOR NGO ----------
export const getPendingReviews = async (req, res) => {
  try {
    const { ngoId } = req.params;

    const pendingPickups = await Pickup.find({
      ngoId,
      status: { $in: ["picked-up", "confirmed"] },
      isReviewed: false,
    })
      .populate("hotelId", "hotelName email phone")
      .populate("foodId", "foodType quantity servesPeople pickupAddress")
      .sort({ updatedAt: -1 });

    res.json({
      message: "Pending reviews fetched successfully",
      pendingReviews: pendingPickups,
      count: pendingPickups.length,
    });
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- GET ALL REVIEWS (ADMIN) ----------
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("hotelId", "hotelName email city")
      .populate("ngoId", "organizationName email city")
      .populate("donationId", "foodType quantity");

    res.json({
      message: "All reviews fetched successfully",
      reviews,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- GET REVIEW STATISTICS ----------
export const getReviewStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      message: "Review statistics fetched successfully",
      stats: {
        totalReviews,
        averageRating: avgRating[0]?.averageRating || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


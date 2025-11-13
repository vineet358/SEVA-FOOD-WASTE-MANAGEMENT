import Hotel from "../models/Hotel.js";
import Ngo from "../models/Ngo.js";
import Food from "../models/Food.js";
import Review from "../models/Review.js";
import Pickup from "../models/Pickup.js";
import Complaint from "../models/Complaint.js";
import { sendHotelReviewStatusEmail } from "../utils/emailService.js";
import { io } from "../server.js";

// ---------- GET TOP HOTELS ----------
export const getTopHotels = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const topHotels = await Hotel.find({
      verificationStatus: "verified",
      isBlacklisted: false,
      totalReviews: { $gt: 0 },
    })
      .select("hotelName email city averageRating totalReviews phone address")
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit);

    const hotelsWithStats = await Promise.all(
      topHotels.map(async (hotel) => {
        const totalDonations = await Food.countDocuments({ hotelId: hotel._id });
        const successfulDonations = await Food.countDocuments({
          hotelId: hotel._id,
          status: { $in: ["taken", "picked-up"] },
        });

        const pickupRatio = totalDonations > 0 ? successfulDonations / totalDonations : 0;
        const ratingFactor = hotel.averageRating > 0 ? Math.min(hotel.averageRating / 5, 1) : 0;
        const successRate = Math.round(pickupRatio * ratingFactor * 100);
        const pickupReliability = Math.round(pickupRatio * 100);
        const ratingWeight = Math.round(ratingFactor * 100);

        return {
          ...hotel.toObject(),
          hotelId: hotel._id.toString(),
          totalDonations,
          successfulDonations,
          successRate,
          pickupReliability,
          ratingWeight,
          isTopContributor:
            successRate >= 75 && hotel.averageRating >= 4.2 && totalDonations >= 8,
        };
      })
    );

    const rankedHotels = hotelsWithStats.sort((a, b) => {
      if (b.successRate !== a.successRate) return b.successRate - a.successRate;
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      return b.totalReviews - a.totalReviews;
    });

    res.json({
      message: "Top hotels fetched successfully",
      topHotels: rankedHotels,
      count: rankedHotels.length,
    });
  } catch (error) {
    console.error("Error fetching top hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- GET TOP NGOS ----------
export const getTopNgos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const ngos = await Ngo.find({ verificationStatus: "verified" }).select(
      "organizationName email city phone address"
    );

    const ngosWithStats = await Promise.all(
      ngos.map(async (ngo) => {
        const totalAccepted = await Food.countDocuments({
          acceptedByNgoId: ngo._id,
          status: "taken",
        });

        const confirmedPickups = await Pickup.countDocuments({
          ngoId: ngo._id,
          status: "confirmed",
        });

        const reviewsGiven = await Review.countDocuments({ ngoId: ngo._id });

        const avgRatingGiven = await Review.aggregate([
          { $match: { ngoId: ngo._id } },
          { $group: { _id: null, avgRating: { $avg: "$rating" } } },
        ]);

        const activityScore = totalAccepted * 2 + confirmedPickups * 3 + reviewsGiven;

        return {
          ...ngo.toObject(),
          totalAccepted,
          confirmedPickups,
          reviewsGiven,
          averageRatingGiven: avgRatingGiven[0]?.avgRating || 0,
          activityScore,
        };
      })
    );

    const topNgos = ngosWithStats
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, limit);

    res.json({
      message: "Top NGOs fetched successfully",
      topNgos,
      count: topNgos.length,
    });
  } catch (error) {
    console.error("Error fetching top NGOs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- GET BLACKLISTED HOTELS ----------
export const getBlacklistedHotels = async (req, res) => {
  try {
    const blacklistedHotels = await Hotel.find({ isBlacklisted: true })
      .select(
        "hotelName email city phone averageRating totalReviews negativeFeedbackCount blacklistedAt blacklistReason"
      )
      .sort({ blacklistedAt: -1 });

    const hotelsWithStats = await Promise.all(
      blacklistedHotels.map(async (hotel) => {
        const totalDonations = await Food.countDocuments({ hotelId: hotel._id });
        const lowRatings = await Review.countDocuments({
          hotelId: hotel._id,
          rating: { $lte: 2 },
        });

        return {
          ...hotel.toObject(),
          totalDonations,
          lowRatings,
        };
      })
    );

    res.json({
      message: "Blacklisted hotels fetched successfully",
      blacklistedHotels: hotelsWithStats,
      count: hotelsWithStats.length,
    });
  } catch (error) {
    console.error("Error fetching blacklisted hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- TOGGLE BLACKLIST ----------
export const toggleBlacklist = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { action, reason } = req.body;

    if (!["blacklist", "unblacklist", "clear-review"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    let statusPayload = null;

    if (action === "blacklist") {
      hotel.isBlacklisted = true;
      hotel.blacklistedAt = new Date();
      hotel.blacklistReason = reason || "Manually blacklisted by admin after evidence review";
      hotel.underReview = false;
      hotel.underReviewReason = null;
      hotel.underReviewStartedAt = null;

      hotel.negativeFeedbackCount = hotel.negativeFeedbackCount || 0;
      await sendHotelReviewStatusEmail(hotel, "blacklisted", { reason: hotel.blacklistReason });
      statusPayload = {
        status: "blacklisted",
        toastMessage: "Admin review completed. Your account has been blacklisted due to repeated poor ratings.",
      };
    } else if (action === "clear-review") {
      hotel.underReview = false;
      hotel.underReviewReason = null;
      hotel.underReviewStartedAt = null;
      hotel.negativeFeedbackCount = 0;
      hotel.isBlacklisted = false;
      hotel.blacklistedAt = null;
      hotel.blacklistReason = null;

      await sendHotelReviewStatusEmail(hotel, "cleared", {
        message:
          reason || "Admin review completed. You may continue donating food on SEWA.",
      });
      statusPayload = {
        status: "active",
        toastMessage: "Admin review completed. You may resume posting donations.",
      };
    } else {
      hotel.isBlacklisted = false;
      hotel.blacklistedAt = null;
      hotel.blacklistReason = null;
      hotel.negativeFeedbackCount = 0;
      hotel.underReview = false;
      hotel.underReviewReason = null;
      hotel.underReviewStartedAt = null;

      await sendHotelReviewStatusEmail(hotel, "cleared", {
        message:
          reason || "Blacklisting has been removed. Please ensure high quality donations going forward.",
      });
      statusPayload = {
        status: "active",
        toastMessage: "Blacklisting removed. Please maintain high food safety standards.",
      };
    }

    await hotel.save();

    if (statusPayload) {
      io.emit(`hotel-status-update-${hotel._id}`, {
        hotelId: hotel._id.toString(),
        ...statusPayload,
        underReview: hotel.underReview,
        underReviewReason: hotel.underReviewReason,
        isBlacklisted: hotel.isBlacklisted,
        blacklistReason: hotel.blacklistReason,
        averageRating: hotel.averageRating,
        negativeFeedbackCount: hotel.negativeFeedbackCount,
      });
    }

    res.json({
      message: `Hotel ${action === "blacklist" ? "blacklisted" : "updated"} successfully`,
      hotel: {
        hotelName: hotel.hotelName,
        isBlacklisted: hotel.isBlacklisted,
        blacklistedAt: hotel.blacklistedAt,
        blacklistReason: hotel.blacklistReason,
        underReview: hotel.underReview,
        underReviewReason: hotel.underReviewReason,
        negativeFeedbackCount: hotel.negativeFeedbackCount,
      },
    });
  } catch (error) {
    console.error("Error toggling blacklist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- DASHBOARD STATS ----------
export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalHotels = await Hotel.countDocuments({ verificationStatus: "verified" });
    const totalNgos = await Ngo.countDocuments({ verificationStatus: "verified" });
    const totalDonations = await Food.countDocuments();
    const successfulDonations = await Food.countDocuments({ status: { $in: ["taken", "picked-up"] } });
    const totalReviews = await Review.countDocuments();
    const blacklistedHotels = await Hotel.countDocuments({ isBlacklisted: true });
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: "pending" });
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const verifiedComplaintsThisWeek = await Complaint.countDocuments({
      status: "verified",
      updatedAt: { $gte: oneWeekAgo },
    });

    const avgHotelRating = await Hotel.aggregate([
      { $match: { totalReviews: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: "$averageRating" } } },
    ]);

    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("hotelId", "hotelName")
      .populate("ngoId", "organizationName");

    const ratingDistribution = await Review.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hotelsNeedingAttention = await Hotel.find({
      averageRating: { $lt: 3, $gt: 0 },
      isBlacklisted: false,
      totalReviews: { $gte: 2 },
    })
      .select("hotelName averageRating totalReviews negativeFeedbackCount")
      .limit(5);

    const avgHotelRatingValue = avgHotelRating[0]?.avgRating || 0;
    const ratingFactor = avgHotelRatingValue > 0 ? avgHotelRatingValue / 5 : 0;
    const compositeSuccessRate =
      totalDonations > 0 ? (successfulDonations / totalDonations) * ratingFactor * 100 : 0;

    res.json({
      message: "Admin dashboard statistics fetched successfully",
      stats: {
        totalHotels,
        totalNgos,
        totalDonations,
        successfulDonations,
        totalReviews,
        blacklistedHotels,
        averageHotelRating: avgHotelRatingValue,
        successRate: compositeSuccessRate,
        complaintsSummary: {
          total: totalComplaints,
          pending: pendingComplaints,
          verifiedThisWeek: verifiedComplaintsThisWeek,
        },
      },
      recentReviews,
      ratingDistribution,
      hotelsNeedingAttention,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- PERFORMANCE TRENDS ----------
export const getPerformanceTrends = async (req, res) => {
  try {
    const { period } = req.query;

    let dateFilter;
    const now = new Date();

    switch (period) {
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const reviewTrends = await Review.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const donationTrends = await Food.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          total: { $sum: 1 },
          taken: {
            $sum: {
              $cond: [{ $in: ["$status", ["taken", "picked-up"]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({
      message: "Performance trends fetched successfully",
      period: period || "month",
      reviewTrends,
      donationTrends,
    });
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getHotelDetail = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId)
      .select(
        "hotelName email city phone address averageRating totalReviews negativeFeedbackCount isBlacklisted blacklistReason blacklistedAt underReview underReviewReason underReviewStartedAt"
      )
      .lean();

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const recentDonations = await Food.find({ hotelId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("foodType quantity servesPeople status preparedAt pickedUpAt acceptedAt images")
      .lean();

    const recentPickups = await Pickup.find({ hotelId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("ngoId", "organizationName email")
      .select("status pickedUpAt reviewedAt")
      .lean();

    const recentReviews = await Review.find({ hotelId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("ngoId", "organizationName")
      .select("rating reviewText reason photoEvidenceUrl createdAt")
      .lean();

    res.json({
      hotel,
      recentDonations,
      recentPickups,
      recentReviews,
    });
  } catch (error) {
    console.error("Error fetching hotel detail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


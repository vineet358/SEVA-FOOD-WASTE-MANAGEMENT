import path from "path";
import Complaint from "../models/Complaint.js";
import Pickup from "../models/Pickup.js";
import Hotel from "../models/Hotel.js";
import Ngo from "../models/Ngo.js";
import Food from "../models/Food.js";
import { io } from "../server.js";
import {
  sendComplaintSubmittedEmail,
  sendComplaintResolutionEmail,
} from "../utils/emailService.js";

const buildComplaintPayload = (complaintDoc) =>
  complaintDoc
    .populate([
      { path: "complaintByNgo", select: "organizationName email phone city" },
      { path: "againstHotel", select: "hotelName email managerName phone city" },
      { path: "donationId", select: "foodType quantity servesPeople pickupAddress preparedAt" },
    ])
    .then((doc) => doc);

export const submitComplaint = async (req, res) => {
  try {
    const { pickupId, description, ngoId } = req.body;
    if (!pickupId || !description || !ngoId) {
      return res.status(400).json({ message: "pickupId, ngoId and description are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo proof is required to raise a complaint." });
    }

    const pickup = await Pickup.findById(pickupId)
      .populate("hotelId", "hotelName email managerName phone city isBlacklisted underReview")
      .populate("ngoId", "organizationName email phone city")
      .populate("foodId");

    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found." });
    }

    if (pickup.ngoId._id.toString() !== ngoId) {
      return res.status(403).json({ message: "You are not authorized to complain about this pickup." });
    }

    if (!["confirmed", "picked-up"].includes(pickup.status)) {
      return res.status(400).json({
        message: "Complaints can be raised only after OTP verified pickup.",
      });
    }

    const existingComplaint = await Complaint.findOne({
      pickupId,
      status: { $in: ["pending", "verified"] },
    });

    if (existingComplaint) {
      return res.status(409).json({
        message: "A complaint has already been raised for this donation.",
        complaintId: existingComplaint._id,
      });
    }

    const photoProofPath = path.posix.join("/uploads/complaint-photos", req.file.filename);

    const complaint = await Complaint.create({
      complaintByNgo: pickup.ngoId._id,
      againstHotel: pickup.hotelId._id,
      pickupId: pickup._id,
      donationId: pickup.foodId._id,
      description,
      photoProof: photoProofPath,
    });

    const hotel = await Hotel.findById(pickup.hotelId._id);
    if (hotel) {
      hotel.isBlacklisted = true;
      hotel.blacklistedAt = new Date();
      hotel.blacklistReason =
        "Donation complaints pending admin verification. Please await further updates.";
      hotel.underReview = true;
      hotel.underReviewReason = `Complaint submitted by ${pickup.ngoId.organizationName}`;
      hotel.underReviewStartedAt = new Date();
      await hotel.save();
    }

    pickup.complaintId = complaint._id;
    pickup.complaintStatus = "pending";
    await pickup.save();

    const populatedComplaint = await buildComplaintPayload(complaint);

    try {
      await sendComplaintSubmittedEmail({
        complaint: populatedComplaint,
        ngo: pickup.ngoId,
        hotel,
      });
    } catch (emailError) {
      console.error("Failed to send complaint submission emails:", emailError);
    }

    io.to(pickup.hotelId._id.toString()).emit(`hotel-status-update-${pickup.hotelId._id}`, {
      hotelId: pickup.hotelId._id.toString(),
      status: "under-review",
      underReview: true,
      underReviewReason: hotel?.underReviewReason,
      isBlacklisted: true,
      blacklistReason: hotel?.blacklistReason,
      toastMessage:
        "An NGO complaint has been submitted. Your account is temporarily disabled until admin review.",
    });

    io.emit("admin-complaint-created", {
      complaintId: complaint._id,
      hotelName: pickup.hotelId.hotelName,
      ngoName: pickup.ngoId.organizationName,
      submittedAt: complaint.createdAt,
    });

    io.to(pickup.ngoId._id.toString()).emit("ngo-complaint-update", {
      complaintId: complaint._id,
      status: "pending",
      pickupId: pickup._id,
      donationId: pickup.foodId,
    });

    res.status(201).json({
      message: "Complaint submitted successfully.",
      complaint: populatedComplaint,
    });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate("complaintByNgo", "organizationName email city")
      .populate("againstHotel", "hotelName email city underReview isBlacklisted")
      .populate("donationId", "foodType quantity servesPeople pickupAddress");

    res.json({
      message: "Complaints fetched successfully",
      complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId)
      .populate("complaintByNgo", "organizationName email phone address city")
      .populate("againstHotel", "hotelName email phone address city managerName")
      .populate("donationId")
      .populate("pickupId");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    res.json({
      message: "Complaint detail fetched successfully",
      complaint,
    });
  } catch (error) {
    console.error("Error fetching complaint detail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { action, note } = req.body;

    if (!["verified", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use verified or rejected." });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate("complaintByNgo", "organizationName email phone")
      .populate("againstHotel", "hotelName email managerName phone")
      .populate("pickupId")
      .populate("donationId");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    const hotel = await Hotel.findById(complaint.againstHotel._id);
    const pickup = await Pickup.findById(complaint.pickupId._id);

    if (!hotel || !pickup) {
      return res
        .status(404)
        .json({ message: "Associated hotel or pickup record missing for this complaint." });
    }

    complaint.status = action;
    complaint.verifiedByAdmin = "admin";
    complaint.resolutionNote = note || null;
    await complaint.save();

    pickup.complaintStatus = action;
    await pickup.save();

    let toastMessage = "";

    if (action === "verified") {
      hotel.isBlacklisted = true;
      hotel.underReview = true;
      hotel.blacklistReason =
        note || "Complaint verified by admin. Reach out to admin for reactivation.";
      hotel.underReviewReason = "Complaint verified by admin.";
      toastMessage = "Admin verified the complaint. Your account remains disabled.";
    } else {
      hotel.isBlacklisted = false;
      hotel.blacklistedAt = null;
      hotel.blacklistReason = null;
      hotel.underReview = false;
      hotel.underReviewReason = null;
      hotel.underReviewStartedAt = null;
      toastMessage = "Admin rejected the complaint. You may resume donations.";
    }

    await hotel.save();

    try {
      await sendComplaintResolutionEmail({
        complaint,
        hotel,
        ngo: complaint.complaintByNgo,
      });
    } catch (emailError) {
      console.error("Failed to send complaint resolution emails:", emailError);
    }

    io.to(hotel._id.toString()).emit(`hotel-status-update-${hotel._id}`, {
      hotelId: hotel._id.toString(),
      status: action === "verified" ? "blacklisted" : "active",
      underReview: hotel.underReview,
      underReviewReason: hotel.underReviewReason,
      isBlacklisted: hotel.isBlacklisted,
      blacklistReason: hotel.blacklistReason,
      toastMessage,
    });

    io.emit("admin-complaint-updated", {
      complaintId: complaint._id,
      status: complaint.status,
    });

    io.to(complaint.complaintByNgo._id.toString()).emit("ngo-complaint-update", {
      complaintId: complaint._id,
      status: complaint.status,
      note: complaint.resolutionNote,
      pickupId: complaint.pickupId?._id || complaint.pickupId,
      donationId: complaint.donationId?._id || complaint.donationId,
    });

    res.json({
      message: `Complaint ${action === "verified" ? "approved" : "rejected"} successfully.`,
      complaint,
    });
  } catch (error) {
    console.error("Error resolving complaint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


import Food from "../models/Food.js";
import {io} from "../server.js";
import Pickup from "../models/Pickup.js";
import nodemailer from "nodemailer";
import Hotel from "../models/Hotel.js";
import Ngo from "../models/Ngo.js";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

dotenv.config();
console.log("GMAIL_APP_PASSWORD =", process.env.GMAIL_APP_PASSWORD);

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'vp1246194@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


// ---------- AUTO MARK EXPIRED FOODS ----------
const markExpiredFoods = async () => {
  try {
    await Food.updateMany(
      { status: "available", expiryAt: { $lte: new Date() } },
      { status: "expired" }
    );
  } catch (err) {
    console.error("Error marking expired foods:", err);
  }
};

// ---------- ADD FOOD ----------
export const addFood = async (req, res) => {
  try {
    const {
      hotelId,
      hotelName,
      foodType,
      quantity,
      servesPeople,
      description,
      preparedAt: preparedAtRaw,
      hotelExpiryAt: hotelExpiryRaw,
      pickupAddress,
      city,
      latitude,
      longitude,
      images,
      prepTime
    } = req.body;


    const hotelRecord = await Hotel.findById(hotelId).select(
      "hotelName managerName email isBlacklisted blacklistReason averageRating underReview underReviewReason"
    );
    if (!hotelRecord) {
      return res.status(404).json({ message: "Hotel account not found. Please login again." });
    }
    if (hotelRecord.isBlacklisted) {
      return res.status(403).json({
        status: "blacklisted",
        message:
          "Your account has received poor ratings. Admin blacklist verification was completed and further updates were shared via email.",
        reason: hotelRecord.blacklistReason,
        averageRating: hotelRecord.averageRating,
      });
    }
    if (hotelRecord.underReview) {
      return res.status(403).json({
        status: "under-review",
        message:
          "Multiple poor ratings have been observed. For safety, your account is under admin review. You will be notified via email once verification is complete.",
        reason: hotelRecord.underReviewReason,
        averageRating: hotelRecord.averageRating,
      });
    }

    if (
      !hotelId ||
      !hotelName ||
      !foodType ||
      !quantity ||
      !servesPeople ||
      !preparedAtRaw ||
      !hotelExpiryRaw ||
      !pickupAddress
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        required: [
          "hotelId",
          "hotelName",
          "foodType",
          "quantity",
          "servesPeople",
          "preparedAt",
          "hotelExpiryAt",
          "pickupAddress"
        ],
        received: {
          hotelId: !!hotelId,
          hotelName: !!hotelName,
          foodType: !!foodType,
          quantity: !!quantity,
          servesPeople: !!servesPeople,
          preparedAt: !!preparedAtRaw,
          hotelExpiryAt: !!hotelExpiryRaw,
          pickupAddress: !!pickupAddress
        }
      });
    }

  
    const shelfLifeMap = {
      vegan: 24,
      veg: 12,
      'non-veg': 6,
    };


    let preparedAt;
    if (typeof preparedAtRaw === 'string') {
      preparedAt = new Date(preparedAtRaw);
    } else {
      preparedAt = new Date(preparedAtRaw);
    }
    
    console.log('Parsed preparedAt:', preparedAt, 'Valid:', !isNaN(preparedAt.getTime()));
    

    if (isNaN(preparedAt.getTime())) {
      return res.status(400).json({ 
        message: "Invalid preparedAt date format",
        received: preparedAtRaw,
        type: typeof preparedAtRaw
      });
    }

    // Parse hotelExpiryAt
    let hotelExpiryAt;
    if (typeof hotelExpiryRaw === 'string') {
      hotelExpiryAt = new Date(hotelExpiryRaw);
    } else {
      hotelExpiryAt = new Date(hotelExpiryRaw);
    }
    
    console.log('Parsed hotelExpiryAt:', hotelExpiryAt, 'Valid:', !isNaN(hotelExpiryAt.getTime()));
    
    // Validate hotelExpiryAt
    if (isNaN(hotelExpiryAt.getTime())) {
      return res.status(400).json({ 
        message: "Invalid hotelExpiryAt date format",
        received: hotelExpiryRaw,
        type: typeof hotelExpiryRaw
      });
    }


    const shelfLifeHours = shelfLifeMap[foodType] || 6;
    const autoExpiryAt = new Date(preparedAt.getTime() + shelfLifeHours * 60 * 60 * 1000);
    
    console.log('Calculated autoExpiryAt:', autoExpiryAt, 'Valid:', !isNaN(autoExpiryAt.getTime()));

    const now = new Date();

    // Validation checks
    if (preparedAt > now) {
      return res.status(400).json({ message: "Preparation time cannot be in the future" });
    }

    if (hotelExpiryAt <= preparedAt) {
      return res.status(400).json({ 
        message: "Expiry must be after preparation time",
        preparedAt: preparedAt.toISOString(),
        hotelExpiryAt: hotelExpiryAt.toISOString()
      });
    }

    if (hotelExpiryAt <= now) {
      return res.status(400).json({ message: "Food has already expired" });
    }

    const diffMs = Math.abs(hotelExpiryAt.getTime() - autoExpiryAt.getTime());
    const expiryDifferenceHours = Math.round(diffMs / (1000 * 60 * 60));

    const expiryMismatchWarning = expiryDifferenceHours > 2;
    const finalExpiryAt = hotelExpiryAt < autoExpiryAt ? hotelExpiryAt : autoExpiryAt;
    
    console.log('Final expiry calculation:', {
      hotelExpiryAt: hotelExpiryAt.toISOString(),
      autoExpiryAt: autoExpiryAt.toISOString(),
      finalExpiryAt: finalExpiryAt.toISOString(),
      valid: !isNaN(finalExpiryAt.getTime())
    });

    // Validate finalExpiryAt before saving
    if (isNaN(finalExpiryAt.getTime())) {
      return res.status(500).json({ 
        message: "Error calculating final expiry date",
        debug: {
          hotelExpiryAt,
          autoExpiryAt,
          finalExpiryAt
        }
      });
    }

    // Determine status based on expiry
    const status = finalExpiryAt < now ? "expired" : "available";

    // Create new food document with explicit date values
    const foodData = {
      hotelId,
      hotelName: hotelRecord.hotelName,
      foodType,
      quantity: Number(quantity),
      servesPeople: Number(servesPeople),
      description: description || '',
      preparedAt: preparedAt,
      hotelExpiryAt: hotelExpiryAt,
      autoExpiryAt: autoExpiryAt,
      expiryAt: finalExpiryAt,
      expiryDifferenceHours,
      expiryMismatchWarning,
      pickupAddress,
      city: city || null,
      latitude: latitude || null,
      longitude: longitude || null,
      images: images || [],
      status,
      expectedShelfLife: shelfLifeHours
    };

    console.log('Creating food document with data:', {
      ...foodData,
      preparedAt: foodData.preparedAt.toISOString(),
      hotelExpiryAt: foodData.hotelExpiryAt.toISOString(),
      autoExpiryAt: foodData.autoExpiryAt.toISOString(),
      expiryAt: foodData.expiryAt.toISOString()
    });

    const newFood = new Food(foodData);
    const savedFood = await newFood.save();

    res.status(201).json({
      message: expiryMismatchWarning
        ? "Food added with expiry mismatch warning"
        : "Food availability added successfully",
      food: savedFood,
      info: {
        preparedAt: preparedAt.toISOString(),
        hotelExpiryAt: hotelExpiryAt.toISOString(),
        autoExpiryAt: autoExpiryAt.toISOString(),
        finalExpiryAt: finalExpiryAt.toISOString(),
        expiryDifferenceHours,
        expiryMismatchWarning
      }
    });

  } catch (error) {
    console.error("Error in addFood:", error);
    console.error("Error stack:", error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      }));
      
      return res.status(400).json({ 
        message: "Validation Error", 
        errors,
        fullError: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message,
      name: error.name
    });
  }
};

// ---------- GET DONATION HISTORY (Hotel) ----------
export const getDonationHistory = async (req, res) => {
  try {
    const { hotelId } = req.params;
    if (!hotelId) return res.status(400).json({ message: "Hotel ID required" });

    await markExpiredFoods();

    const donations = await Food.find({ hotelId })
      .sort({ createdAt: -1 })
      .populate("acceptedByNgoId", "organizationName email phone")
      .lean();

    res.json({ message: "Donation history fetched", donations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------- AVAILABLE DONATIONS (NGO View) ----------
export const getAvailableDonations = async (req, res) => {
  try {
    const { ngoId } = req.query;
    await markExpiredFoods();

    let filter = { status: "available" };
    let ngoCity = null;

    if (ngoId) {
      const ngo = await Ngo.findById(ngoId).select("city");
      if (ngo && ngo.city) {
        ngoCity = ngo.city;
        filter.city = ngoCity;
        filter.rejectedBy = { $ne: ngoId };
      }
    }

   
    const donations = await Food.find(filter)
      .sort({ createdAt: -1 })
      .populate("hotelId", "phone email managerName");

  
    const formattedDonations = donations.map(food => {
      const now = new Date();
      const timeLeftMs = food.expiryAt - now;
      const hoursLeft = Math.max(Math.floor(timeLeftMs / (1000 * 60 * 60)), 0);

      return {
        ...food.toObject(),
        expiresIn: `${hoursLeft} hours`,
        showExactExpiry: food.expiryMismatchWarning,
      };
    });

    res.json({
      message: "Available donations fetched successfully",
      donations: formattedDonations,
      filteredByCity: ngoCity || "Showing all available donations (no NGO filter)",
    });
  } catch (error) {
    console.error("Error fetching available donations:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ---------- ACCEPT DONATION ----------
export const acceptDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { ngoId, ngoName } = req.body;

    if (!ngoId || !ngoName)
      return res.status(400).json({ message: "NGO ID and name required" });

    await markExpiredFoods();

    const food = await Food.findOneAndUpdate( { _id: id, status: "available" }, { status: "taken", acceptedByNgo: ngoName, acceptedByNgoId: ngoId, acceptedAt: new Date(), }, { new: true } );
    if (!food) return res.status(404).json({ message: "Donation not found or expired" });
  io.emit(`food-accepted-${food.hotelId}`, {
    message: `${ngoName} has accepted your food donation.`,
    ngoName: ngoName,
    foodId: food._id,
  });
  
    res.json({
      message: "Donation accepted successfully",
      food,
    });
  } catch (error) {
    console.error("Error accepting donation:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ---------- REJECT DONATION ----------
export const rejectDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { ngoId } = req.body;

    const donation = await Food.findById(id);
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    if (!donation.rejectedBy.includes(ngoId)) {
      donation.rejectedBy.push(ngoId);
      await donation.save();
    }

    res.status(200).json({ message: "Donation rejected successfully" });
  } catch (error) {
    console.error("Error rejecting donation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- NGO HISTORY ----------
export const getNgoHistory = async (req, res) => {
  try {
    const { ngoId } = req.params;
    if (!ngoId) return res.status(400).json({ message: "NGO ID required" });

    await markExpiredFoods();

    const history = await Food.find({
      acceptedByNgoId: ngoId,
      status: { $in: ["taken", "picked-up"] },
    })
      .sort({ acceptedAt: -1 })
      .lean();

    const foodIds = history.map((item) => item._id);
    const pickups = await Pickup.find({
      foodId: { $in: foodIds },
      ngoId,
    })
      .select("foodId status complaintStatus complaintId pickedUpAt createdAt")
      .lean();

    const pickupMap = new Map();
    pickups.forEach((pickup) => {
      pickupMap.set(pickup.foodId.toString(), {
        pickupId: pickup._id,
        pickupStatus: pickup.status,
        complaintStatus: pickup.complaintStatus,
        complaintId: pickup.complaintId,
        pickedUpAt: pickup.pickedUpAt,
      });
    });

    const enrichedHistory = history.map((item) => {
      const pickupInfo = pickupMap.get(item._id.toString());
      return {
        ...item,
        pickupInfo: pickupInfo || null,
      };
    });

    res.json(enrichedHistory);
  } catch (err) {
    console.error("Error fetching NGO history:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const generateOTP = async (req, res) => {
  try {
    const { hotelId, ngoId, foodId } = req.body;

    if (!hotelId || !ngoId || !foodId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

 
    const hotel = await Hotel.findById(hotelId).select("email managerName");
    if (!hotel || !hotel.email) {
      return res.status(404).json({ message: "Hotel not found or missing email" });
    }
    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: "Food not found" });
    if (food.status !== "taken") {
      return res.status(400).json({ message: "OTP can only be generated for accepted donations awaiting pickup." });
    }

    const now = Date.now();

    
   
    const maxTravelTimeMs = 3 * 60 * 60 * 1000; 
    const otpExpiryBeforeFoodMs = 30 * 60 * 1000; 
    const timeUntilFoodExpiry = food.expiryAt - now - otpExpiryBeforeFoodMs;

    const otpExpiresAt = new Date(now + Math.min(maxTravelTimeMs, timeUntilFoodExpiry));
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const pickup = await Pickup.create({
      hotelId,
      ngoId,
      foodId,
      otp,
      otpExpiresAt,
      status: "pending",
    });
    await transporter.sendMail({
      from: 'Vineet Pandey <vp1246194@gmail.com>', 
      to: hotel.email,
      subject: "Sewa Pickup OTP Verification",
      html: `
        <p>Hello ${hotel.managerName || "Hotel"},</p>
        <p>Your OTP for confirming food pickup is <b>${otp}</b>.</p>
        <p>This OTP will expire at <b>${otpExpiresAt.toLocaleString()}</b>.</p>
        <p>Regards,<br/>Vineet Pandey</p>
      `,
    });
    

    console.log(`OTP ${otp} sent to ${hotel.email}, expires at ${otpExpiresAt}`);
    res.status(200).json({
      success: true,
      message: `OTP sent to ${hotel.email}, valid until ${otpExpiresAt.toLocaleString()}`,
      pickupId: pickup._id,
      otpExpiresAt,
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ---------- VERIFY OTP ----------
export const verifyOTP = async (req, res) => {
  try {
    const { ngoId, enteredOtp, pickupId } = req.body;

    const pickupQuery = pickupId ? { _id: pickupId } : { ngoId, otp: enteredOtp };
    const pickup = await Pickup.findOne(pickupQuery);

    if (!pickup || pickup.otp !== enteredOtp || pickup.ngoId.toString() !== ngoId) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (pickup.status === "picked-up") {
      return res.status(400).json({ success: false, message: "This pickup has already been verified." });
    }

    if (pickup.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    pickup.status = "picked-up";
    pickup.pickedUpAt = new Date();
    await pickup.save();

    const updatedFood = await Food.findOneAndUpdate(
      { _id: pickup.foodId },
      { status: "picked-up", pickedUpAt: new Date() },
      { new: true }
    );

    const ngoDetails = await Ngo.findById(pickup.ngoId).select("organizationName");


    io.emit(`pickup-confirmed-${pickup.hotelId}`, {
      message: "NGO has confirmed the pickup ",
      ngoId: pickup.ngoId,
      foodId: pickup.foodId,
      ngoName: ngoDetails?.organizationName || "Unknown NGO",
    });

    res.json({
      success: true,
      message: "Pickup confirmed successfully",
      food: updatedFood,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

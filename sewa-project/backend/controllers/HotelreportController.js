import mongoose from 'mongoose';
import Food from '../models/Food.js';


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

export const getReports = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!hotelId) {
      return res.status(400).json({ message: 'Hotel ID is required' });
    }


    const objectHotelId = mongoose.Types.ObjectId.isValid(hotelId)
      ? new mongoose.Types.ObjectId(hotelId)
      : null;

    if (!objectHotelId) {
      return res.status(400).json({ message: 'Invalid Hotel ID' });
    }


    await markExpiredFoods();


    const takenDonations = await Food.find({ hotelId: objectHotelId, status: "taken" });

    // Stats
    const totalDonations = takenDonations.length;
    const totalServings = takenDonations.reduce((sum, d) => sum + (d.servesPeople || 0), 0);
    const peopleFed = totalServings;
    const ngosServed = [...new Set(takenDonations.map(d => d.acceptedByNgo))].length;
    const avgDonationSize = totalDonations ? Math.round(totalServings / totalDonations) : 0;

    // Monthly data
    const getMonthName = (date) => date.toLocaleString('default', { month: 'short' });
    const monthlyDataMap = {};
    takenDonations.forEach(d => {
      const month = getMonthName(d.createdAt);
      if (!monthlyDataMap[month]) monthlyDataMap[month] = { donations: 0, servings: 0 };
      monthlyDataMap[month].donations += 1;
      monthlyDataMap[month].servings += d.servesPeople || 0;
    });
    const monthlyData = Object.keys(monthlyDataMap).map(month => ({
      month,
      donations: monthlyDataMap[month].donations,
      servings: monthlyDataMap[month].servings
    }));

    // Food type distribution
    const foodTypeMap = {};
    takenDonations.forEach(d => {
      const type = d.foodType || 'Other';
      foodTypeMap[type] = (foodTypeMap[type] || 0) + 1;
    });
    const foodTypeData = Object.keys(foodTypeMap).map(type => ({
      name: type,
      value: foodTypeMap[type],
      color: type === 'Vegetarian' ? '#10b981' : type === 'Non-Vegetarian' ? '#3b82f6' : '#8b5cf6'
    }));

    // NGO distribution
    const ngoMap = {};
    takenDonations.forEach(d => {
      const ngo = d.acceptedByNgo || 'Unknown';
      if (!ngoMap[ngo]) ngoMap[ngo] = { donations: 0, servings: 0 };
      ngoMap[ngo].donations += 1;
      ngoMap[ngo].servings += d.servesPeople || 0;
    });
    const ngoData = Object.keys(ngoMap).map(ngo => ({
      name: ngo,
      donations: ngoMap[ngo].donations,
      servings: ngoMap[ngo].servings
    }));

    res.json({
      totalDonations,
      totalServings,
      peopleFed,
      ngosServed,
      avgDonationSize,
      monthlyData,
      foodTypeData,
      ngoData
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

import Food from '../models/Food.js';

const getDataRange = (period) => {
  const now = new Date();
  let fromDate;
  switch (period) {
    case 'week':
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      fromDate = new Date();
      fromDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      fromDate = new Date();
      fromDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      fromDate = new Date();
      fromDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      fromDate = new Date(0);
  }
  return fromDate;
};

// Helper to mark expired donations
const markExpiredDonations = async () => {
  try {
    await Food.updateMany(
      { status: "available", expiryAt: { $lte: new Date() } },
      { status: "expired" }
    );
  } catch (err) {
    console.error("Error marking expired donations:", err);
  }
};

export const getOverviewReport = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const { period = 'month' } = req.query;
    const fromDate = getDataRange(period);

    await markExpiredDonations(); 

    // Only count donations actually accepted by NGO
    const donations = await Food.find({
      acceptedByNgoId: ngoId,
      acceptedAt: { $gte: fromDate },
      status: "taken"
    });

    const totalDonations = donations.length;
    const totalServings = donations.reduce((sum, d) => sum + (d.servesPeople || 0), 0);

    res.json({
      title: 'Overview Report',
      period: `Last ${period}`,
      stats: [
        { label: 'Total Donations', value: totalDonations },
        { label: 'Total Servings', value: totalServings },
      ]
    });
  } catch (error) {
    console.error('Error generating overview report:', error);
    res.status(500).json({ message: 'Server error generating overview report' });
  }
};

export const getDonationsReport = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const { period = 'month' } = req.query;
    const fromDate = getDataRange(period);

    await markExpiredDonations();

    const donations = await Food.find({
      acceptedByNgoId: ngoId,
      acceptedAt: { $gte: fromDate },
      status: "taken"
    });

    const donorStats = {};
    donations.forEach(d => {
      donorStats[d.hotelName] = donorStats[d.hotelName] || { donations: 0, servings: 0 };
      donorStats[d.hotelName].donations += 1;
      donorStats[d.hotelName].servings += d.servesPeople || 0;
    });

    const topDonors = Object.entries(donorStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.donations - a.donations)
      .slice(0, 5);

    res.json({
      title: "Donations Report",
      period: `Last ${period}`,
      topDonors,
    });
  } catch (err) {
    console.error("Error fetching donations report:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getImpactReport = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const { period = 'month' } = req.query;
    const fromDate = getDataRange(period);

    await markExpiredDonations();

    const donations = await Food.find({
      acceptedByNgoId: ngoId,
      acceptedAt: { $gte: fromDate },
      status: "taken"
    });

    const areaStats = {};
    let totalServings = 0;

    donations.forEach(d => {
      const area = d.pickupAddress || 'Unknown';
      areaStats[area] = areaStats[area] || { donations: 0, servings: 0 };
      areaStats[area].donations += 1;
      areaStats[area].servings += d.servesPeople || 0;
      totalServings += d.servesPeople || 0;
    });

    const distributionByArea = Object.entries(areaStats).map(([area, stats]) => ({
      area,
      servings: stats.servings,
      percentage: totalServings > 0 ? ((stats.servings / totalServings) * 100).toFixed(1) : 0
    }));

    res.json({
      title: "Impact Report",
      period: `Last ${period}`,
      distributionByArea,
    });
  } catch (err) {
    console.error("Error fetching impact report:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

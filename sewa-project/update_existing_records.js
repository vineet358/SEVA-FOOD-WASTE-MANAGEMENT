// MongoDB Script to Update Existing Records with City Information
// Run this in MongoDB Compass or MongoDB Shell

// Update the specific hotel (blessing) with city
db.hotels.updateOne(
  { _id: ObjectId("68f7e28aadb8e73df9a92bab") },
  { $set: { city: "haldwani" } }
);

// Update the specific food donation with city and coordinates
// These are approximate coordinates for Haldwani
db.foods.updateOne(
  { _id: ObjectId("68f7e39badb8e73df9a92bb0") },
  { 
    $set: { 
      city: "haldwani",
      latitude: 29.2183,
      longitude: 79.5130
    } 
  }
);

// Verify the updates
console.log("Hotel after update:");
db.hotels.findOne({ _id: ObjectId("68f7e28aadb8e73df9a92bab") });

console.log("Food after update:");
db.foods.findOne({ _id: ObjectId("68f7e39badb8e73df9a92bb0") });

// Alternative: Update ALL records without city to "haldwani" (use with caution)
// db.hotels.updateMany({ city: { $exists: false } }, { $set: { city: "haldwani" } });
// db.foods.updateMany({ city: { $exists: false } }, { $set: { city: "haldwani", latitude: 29.2183, longitude: 79.5130 } });



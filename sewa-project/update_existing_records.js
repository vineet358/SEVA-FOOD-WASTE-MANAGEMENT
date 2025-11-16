// Update city for a specific hotel
db.hotels.updateOne(
  { _id: ObjectId("68f7e28aadb8e73df9a92bab") },
  { 
    $set: { 
      city: "haldwani" 
    } 
  }
);

// Update city and coordinates for a specific food entry
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

// Logging updated documents for verification
console.log("Hotel after update:");
printjson(db.hotels.findOne({ _id: ObjectId("68f7e28aadb8e73df9a92bab") }));

console.log("Food after update:");
printjson(db.foods.findOne({ _id: ObjectId("68f7e39badb8e73df9a92bb0") }));

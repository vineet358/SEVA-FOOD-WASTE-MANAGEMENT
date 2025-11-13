import ChatMessage from "../models/ChatMessage.js";
import Hotel from "../models/Hotel.js";
import Ngo from "../models/Ngo.js";

const buildContactResponse = (documents, type) =>
  documents.map((doc) => ({
    id: doc._id,
    type,
    name: type === "hotel" ? doc.hotelName : doc.organizationName,
    email: doc.email,
    phone: doc.phone,
    city: doc.city || "",
    verificationStatus: doc.verificationStatus,
  }));

export const getContacts = async (req, res) => {
  try {
    const { userType } = req.query;
    if (!userType || !["hotel", "ngo"].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    if (userType === "hotel") {
      const ngos = await Ngo.find({ verificationStatus: "verified" }).select(
        "organizationName email phone city verificationStatus"
      );
      return res.json({ contacts: buildContactResponse(ngos, "ngo") });
    }

    const hotels = await Hotel.find({ verificationStatus: "verified" }).select(
      "hotelName email phone city verificationStatus"
    );
    return res.json({ contacts: buildContactResponse(hotels, "hotel") });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId, peerId } = req.query;
    if (!userId || !peerId) {
      return res.status(400).json({ message: "Missing user or peer id" });
    }

    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const markMessagesRead = async (req, res) => {
  try {
    const { userId, peerId } = req.body;
    if (!userId || !peerId) {
      return res.status(400).json({ message: "Missing user or peer id" });
    }

    await ChatMessage.updateMany(
      { receiverId: userId, senderId: peerId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages" });
  }
};





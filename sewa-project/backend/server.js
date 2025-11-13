import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
dotenv.config();

import individualAuth from "./routes/AuthIndividual.js";
import ngoAuth from "./routes/authNgo.js";
import hotelAuth from "./routes/authHotel.js";
import foodRoutes from "./routes/foodRoutes.js";
import hotelDashboardRoutes from "./routes/hotelDashboard.js";
import reportRoutes from "./routes/reportRoutes.js";
import HotelReportRoutes from "./routes/HotelReportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import ChatMessage from "./models/ChatMessage.js";


const app = express();
const server=http.createServer(app);
export const io=new Server(server,{
  cors: { origin: "*" }, 
});
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("register", ({ userId }) => {
    if (!userId) return;
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on("sendMessage", async (payload, callback) => {
    try {
      const { senderId, senderType, receiverId, receiverType, message } = payload || {};
      if (!senderId || !receiverId || !message) {
        return callback?.({ success: false, error: "Missing fields" });
      }

      const chatMessage = await ChatMessage.create({
        senderId,
        senderType,
        receiverId,
        receiverType,
        message,
      });

      const messageData = chatMessage.toObject();
      io.to(receiverId).emit("newMessage", messageData);
      io.to(senderId).emit("messageSent", messageData);

      callback?.({ success: true, message: messageData });
    } catch (error) {
      console.error("Error sending message:", error);
      callback?.({ success: false, error: "Failed to send message" });
    }
  });

  socket.on("typing", ({ senderId, senderType, receiverId, isTyping }) => {
    if (!senderId || !receiverId) return;
    io.to(receiverId).emit("typingStatus", { senderId, senderType, isTyping });
  });

  socket.on("markRead", async ({ userId, peerId }) => {
    try {
      if (!userId || !peerId) return;
      await ChatMessage.updateMany(
        { receiverId: userId, senderId: peerId, read: false },
        { $set: { read: true } }
      );
      io.to(userId).emit("messagesRead", { peerId });
    } catch (error) {
      console.error("Error marking messages read via socket:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
app.use(express.json());
app.use(cors());

app.use("/api/auth/individual", individualAuth);
app.use("/api/auth/ngo", ngoAuth);
app.use("/api/auth/hotel", hotelAuth);
app.use("/api/food",foodRoutes);
app.use("/api/hotel", hotelDashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/hotelReports", HotelReportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));

import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["hotel", "ngo"],
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    receiverType: {
      type: String,
      enum: ["hotel", "ngo"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
chatMessageSchema.index({ receiverId: 1, read: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;





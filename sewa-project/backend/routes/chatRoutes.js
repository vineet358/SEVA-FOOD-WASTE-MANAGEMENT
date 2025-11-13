import express from "express";
import {
  getContacts,
  getMessages,
  markMessagesRead,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/contacts", getContacts);
router.get("/messages", getMessages);
router.patch("/read", markMessagesRead);

export default router;





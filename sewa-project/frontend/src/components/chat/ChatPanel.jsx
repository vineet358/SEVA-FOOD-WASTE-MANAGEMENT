import React, { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Send, MessageCircle, Search, Check } from "lucide-react";
import "./Chat.css";

const SOCKET_URL = "http://localhost:5000";

const getUserInfo = (userType) => {
  const stored = JSON.parse(localStorage.getItem("userInfo")) || {};
  if (userType === "hotel") {
    return {
      id: stored.hotelId,
      name: stored.hotelName,
      email: stored.email,
    };
  }
  return {
    id: stored.ngoId,
    name: stored.ngoName || stored.organizationName,
    email: stored.email,
  };
};

const ChatPanel = ({ userType = "hotel" }) => {
  const { id: userId, name: userName } = useMemo(() => getUserInfo(userType), [userType]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typingStatus, setTypingStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/contacts?userType=${userType}`
        );
        const contactList = res.data.contacts || [];
        setContacts(contactList);
        setFilteredContacts(contactList);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    if (userId) {
      fetchContacts();
    }
  }, [userId, userType]);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current.emit("register", { userId });

    const handleIncoming = (message) => {
      if (message.receiverId !== userId) return;

      setContacts((prev) =>
        prev.map((contact) =>
          String(contact.id) === String(message.senderId)
            ? { ...contact, hasUnread: true }
            : contact
        )
      );

      if (selectedContact && String(selectedContact.id) === String(message.senderId)) {
        setMessages((prev) => [...prev, message]);
        socketRef.current.emit("markRead", {
          userId,
          peerId: selectedContact.id,
        });
      }
    };

    socketRef.current.on("newMessage", handleIncoming);

    socketRef.current.on("messageSent", (message) => {
      if (String(message.senderId) === String(userId)) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socketRef.current.on("messagesRead", ({ peerId }) => {
      if (selectedContact && String(selectedContact.id) === String(peerId)) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
      }
    });

    const handleTypingStatus = ({ senderId, isTyping, senderType }) => {
      if (selectedContact && String(selectedContact.id) === String(senderId)) {
        const roleLabel = selectedContact.type === "hotel" ? "Hotel" : "NGO";
        setTypingStatus(isTyping ? `${roleLabel} ${selectedContact.name} is typing...` : null);
      }
    };

    socketRef.current.on("typingStatus", handleTypingStatus);

    return () => {
      socketRef.current?.off("newMessage", handleIncoming);
      socketRef.current?.off("typingStatus", handleTypingStatus);
      socketRef.current?.disconnect();
    };
  }, [userId, selectedContact]);

  useEffect(() => {
    if (!selectedContact) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/messages?userId=${userId}&peerId=${selectedContact.id}`
        );
        setMessages(res.data.messages || []);
        setContacts((prev) =>
          prev.map((contact) =>
            String(contact.id) === String(selectedContact.id)
              ? { ...contact, hasUnread: false }
              : contact
          )
        );
        socketRef.current?.emit("markRead", {
          userId,
          peerId: selectedContact.id,
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [selectedContact, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(contacts);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    setFilteredContacts(
      contacts.filter((contact) => contact.name?.toLowerCase().includes(lowerSearch))
    );
  }, [searchTerm, contacts]);

  const handleSendMessage = () => {
    if (!socketRef.current || !selectedContact || !newMessage.trim()) return;

    socketRef.current.emit(
      "sendMessage",
      {
        senderId: userId,
        senderType: userType,
        receiverId: selectedContact.id,
        receiverType: selectedContact.type,
        message: newMessage.trim(),
      },
      (response) => {
        if (response?.success) {
          setNewMessage("");
        }
      }
    );
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    if (!socketRef.current || !selectedContact) return;

    socketRef.current.emit("typing", {
      senderId: userId,
      senderType: userType,
      receiverId: selectedContact.id,
      isTyping: Boolean(value),
    });
  };

  if (!userId) {
    return (
      <div className="chat-container">
        <div className="chat-empty">Please login to access chat.</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <aside className="chat-sidebar">
        <div className="chat-header">
          <h2>
            <MessageCircle size={20} /> Messages
          </h2>
          <p>{userName}</p>
        </div>
        <div className="chat-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="chat-contacts">
          {filteredContacts.length === 0 && (
            <div className="chat-empty">No contacts available yet.</div>
          )}
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              className={`contact-item ${
                selectedContact && String(selectedContact.id) === String(contact.id)
                  ? "active"
                  : ""
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="contact-avatar">{contact.name?.[0]?.toUpperCase() || "A"}</div>
              <div className="contact-info">
                <span className="contact-name">{contact.name}</span>
                <span className="contact-role">
                  {contact.type === "hotel" ? "Hotel" : "NGO"} Admin
                </span>
              </div>
              {contact.hasUnread && <span className="unread-dot" />}
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        {!selectedContact ? (
          <div className="chat-placeholder">
            <MessageCircle size={48} />
            <h3>Select a conversation</h3>
            <p>Pick a hotel or NGO admin to start collaborating in real-time.</p>
          </div>
        ) : (
          <div className="chat-conversation">
            <header className="chat-conversation-header">
              <div>
                <h3>{selectedContact.name}</h3>
                <span>{selectedContact.type === "hotel" ? "Hotel" : "NGO"} Admin</span>
              </div>
            </header>

            <div className="chat-messages">
              {messages.map((msg) => {
                const isSender = String(msg.senderId) === String(userId);
                return (
                  <div
                    key={msg._id || msg.createdAt}
                    className={`message-item ${isSender ? "sent" : "received"}`}
                  >
                    <div className="message-content">{msg.message}</div>
                    <div className="message-meta">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isSender && msg.read && <Check size={12} className="message-read" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {typingStatus && <div className="typing-indicator">{typingStatus}</div>}

            <div className="chat-input">
              <textarea
                rows="1"
                placeholder={`Message ${selectedContact.name}`}
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button className="send-btn" onClick={handleSendMessage}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatPanel;


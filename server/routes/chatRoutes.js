const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");
const chatRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 60, key: (req) => `${req.ip}:${req.user?.id || "anonymous"}` });
const chatMutationRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, key: (req) => `${req.ip}:${req.user?.id || "anonymous"}` });

const {
  // New Conversation APIs
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
   renameConversation, 
} = require("../controllers/chatController");

/*
|--------------------------------------------------------------------------
| Conversation APIs
|--------------------------------------------------------------------------
*/

router.post("/new", auth, chatMutationRateLimit, createConversation);

router.get("/conversations", auth, getConversations);

router.get("/:conversationId", auth, getConversation);

router.post("/:conversationId", auth, chatRateLimit, sendMessage);

router.delete("/:conversationId", auth, chatMutationRateLimit, deleteConversation);
router.patch("/:conversationId", auth, chatMutationRateLimit, renameConversation);

module.exports = router;

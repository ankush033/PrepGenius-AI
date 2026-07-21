const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  // New Conversation APIs
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
   renameConversation, 

  // Old APIs (Backward Compatibility)
  chat,
  getChatHistory,

} = require("../controllers/chatController");

/*
|--------------------------------------------------------------------------
| Old APIs (Current Frontend)
|--------------------------------------------------------------------------
*/

router.post("/", auth, chat);

router.get("/history", auth, getChatHistory);

/*
|--------------------------------------------------------------------------
| Conversation APIs
|--------------------------------------------------------------------------
*/

router.post("/new", auth, createConversation);

router.get("/conversations", auth, getConversations);

router.get("/:conversationId", auth, getConversation);

router.post("/:conversationId", auth, sendMessage);

router.delete("/:conversationId", auth, deleteConversation);
router.patch("/:conversationId", auth, renameConversation);

module.exports = router;
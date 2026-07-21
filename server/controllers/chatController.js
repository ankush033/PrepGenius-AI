const generateEmbedding = require("../services/embeddingService");
const { searchChunks } = require("../services/pineconeService");
const generateAnswer = require("../services/geminiService");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");


console.log("Conversation Model:", Conversation);
console.log("Type:", typeof Conversation);
// ======================================================
// Create New Conversation
// ======================================================

exports.createConversation = async (req, res) => {
  try {

    const conversation = await Conversation.create({
      user: req.user.id,
      title: "New Chat",
    });

    return res.status(201).json({
      success: true,
      conversation,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ======================================================
// Get All Conversations
// ======================================================

exports.getConversations = async (req, res) => {
  try {

    const conversations = await Conversation.find({
      user: req.user.id,
    })
      .sort({ updatedAt: -1 })
      .select("_id title updatedAt createdAt");

    return res.status(200).json({
      success: true,
      conversations,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================================
// Get Single Conversation
// ======================================================

exports.getConversation = async (req, res) => {
  try {

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      conversation,
      messages,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ======================================================
// Send Message
// ======================================================

exports.sendMessage = async (req, res) => {

  try {

    const { conversationId } = req.params;

    const { question } = req.body;

    if (!question) {

      return res.status(400).json({
        success: false,
        message: "Question is required",
      });

    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {

      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });

    }

    // -------------------------
    // Save User Message
    // -------------------------

    await Message.create({

      conversation: conversationId,
      role: "user",
      content: question,

    });

    // -------------------------
    // Generate Embedding
    // -------------------------

    const embedding =
      await generateEmbedding(question);

    // -------------------------
    // Search Pinecone
    // -------------------------
const matches = await searchChunks(
  embedding,
  req.user.id
);

console.log("========== MATCHES ==========");

matches.forEach((m, i) => {
  console.log({
    index: i,
    score: m.score,
    file: m.metadata?.fileName,
    text: m.metadata?.text?.substring(0, 80),
  });
});

// Similarity Threshold
const SIMILARITY_THRESHOLD = process.env.SIMILARITY_THRESHOLD || 0.60;

// Filter Matches
const filteredMatches = matches.filter(
  (m) => m.score >= SIMILARITY_THRESHOLD
);




console.log(
  "Filtered Matches:",
  filteredMatches.length
);
    let answer =
      "I couldn't find the answer in the uploaded document.";

    let sources = [];

    if (filteredMatches.length > 0) {

      const context =
        filteredMatches
          .map(
            (match) =>
              match.metadata.text
          )
          .join("\n\n-----------------\n\n");

      answer =
        await generateAnswer(
          question,
          context
        );

      sources =
        filteredMatches.map((match) => ({

          fileName:
            match.metadata.fileName,

          score:
            match.score,
          
          text:
            match.metadata.text,

        }));
        filteredMatches.forEach((match, index) => {
  console.log("Match", index);
  console.log(match.metadata);
});

    }

    // -------------------------
    // Save AI Message
    // -------------------------

    await Message.create({

      conversation: conversationId,

      role: "assistant",

      content: answer,

      sources,

    });

    // -------------------------
    // Update Conversation
    // -------------------------

    if (
      conversation.title === "New Chat"
    ) {

      conversation.title =
        question.length > 40
          ? question.substring(0, 40) + "..."
          : question;

    }

    conversation.updatedAt =
      new Date();

    await conversation.save();

    // -------------------------
    // Response
    // -------------------------

    return res.status(200).json({

      success: true,

      answer,

      sources,

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
const Chat = require("../models/Chat");

// ======================================================
// Delete Conversation
// ======================================================

exports.deleteConversation = async (req, res) => {

  try {

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await Message.deleteMany({
      conversation: conversationId,
    });

    await Conversation.findByIdAndDelete(conversationId);

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
// ======================================================
// Rename Conversation
// ======================================================

exports.renameConversation = async (req, res) => {

  try {

    const { conversationId } = req.params;

    const { title } = req.body;

    if (!title || !title.trim()) {

      return res.status(400).json({
        success: false,
        message: "Title is required",
      });

    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {

      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });

    }

    conversation.title = title.trim();

    await conversation.save();

    return res.status(200).json({
      success: true,
      conversation,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
// ======================================================
// Backward Compatible Chat API
// POST /api/chat
// ======================================================

exports.chat = async (req, res) => {

  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const embedding =
      await generateEmbedding(question);

   const matches = await searchChunks(
  embedding,
  req.user.id
);

console.log("========== MATCHES ==========");

matches.forEach((m, i) => {
  console.log({
    index: i,
    score: m.score,
    file: m.metadata?.fileName,
    text: m.metadata?.text?.substring(0, 80),
  });
});

const filteredMatches = matches;

console.log(
  "Filtered Matches:",
  filteredMatches.length
);

    let answer =
      "I couldn't find the answer in the uploaded document.";

    let sources = [];

    if (filteredMatches.length > 0) {

      const context =
        filteredMatches
          .map(
            (match) =>
              match.metadata.text
          )
          .join("\n\n-----------------\n\n");

      answer =
        await generateAnswer(
          question,
          context
        );

      sources =
        filteredMatches.map((match) => ({
          fileName: match.metadata.fileName,
          score: match.score,
        }));

    }

    await Chat.create({
      user: req.user.id,
      question,
      answer,
      sources,
    });

    return res.status(200).json({
      success: true,
      answer,
      sources,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ======================================================
// Backward Compatible History API
// GET /api/chat/history
// ======================================================

exports.getChatHistory = async (req, res) => {

  try {

    const chats = await Chat.find({
      user: req.user.id,
    }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      chats,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
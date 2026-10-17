
const generateEmbedding = require("../services/embeddingService");
const { searchChunks } = require("../services/pineconeService");
const generateAnswer = require("../services/geminiService");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Document = require("../models/Document");
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
    console.error("Create conversation failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to create conversation.",
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
    console.error("Get conversations failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to load conversations.",
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
    console.error("Get conversation failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to load conversation.",
    });
  }
};
// ======================================================
// Send Message
// ======================================================

exports.sendMessage = async (req, res) => {
  let userMessage = null;

  try {

    const { conversationId } = req.params;

    const { question } = req.body;

    if (!question) {

      return res.status(400).json({
        success: false,
        message: "Question is required",
      });

    }
    if (typeof question !== "string" || question.length > 4000) {
      return res.status(400).json({ success: false, message: "Question must be 4,000 characters or fewer." });
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

    // Load only completed turns before saving this question. This avoids
    // sending the current user message twice and keeps history chronological.
    const rawHistory = await Message.find({
      conversation: conversationId,
      $or: [
        { role: "assistant" },
        { role: "user", turnStatus: "complete" },
        { role: "user", turnStatus: { $exists: false } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(6);
    const chronologicalHistory = rawHistory.reverse();
    const completedTurns = [];
    let pendingUserMessage = null;
    for (const message of chronologicalHistory) {
      if (message.role === "user") {
        pendingUserMessage = message;
      } else if (message.role === "assistant" && pendingUserMessage) {
        completedTurns.push([
          { role: "user", content: pendingUserMessage.content },
          { role: "assistant", content: message.content },
        ]);
        pendingUserMessage = null;
      }
    }
    const chatHistory = completedTurns.slice(-3).flat();

    userMessage = await Message.create({
      conversation: conversationId,
      role: "user",
      content: question,
      turnStatus: "pending",
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

// Ignore vectors whose upload did not reach the ready state. This also keeps
// partially written Pinecone data out of retrieval if cleanup later fails.
const readyDocuments = await Document.find({
  user: req.user.id,
  $or: [
    { processingStatus: "ready" },
    { processingStatus: { $exists: false } },
  ],
}).select("_id");
const readyDocumentIds = new Set(readyDocuments.map((document) => document._id.toString()));
const validMatches = matches.filter((match) =>
  readyDocumentIds.has(String(match.metadata?.documentId || ""))
);

// Similarity Threshold
const SIMILARITY_THRESHOLD =
Number(process.env.SIMILARITY_THRESHOLD) || 0.35;

// Filter Matches
const filteredMatches = validMatches.filter(
  (m) => m.score >= SIMILARITY_THRESHOLD
);

filteredMatches.sort((a, b) => b.score - a.score);


    let answer = "I couldn't find the answer in the uploaded document.";

    let sources = [];

    res.status(200);
    res.set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    const sendEvent = (payload) => {
      if (!res.writableEnded && !res.destroyed) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    const context = filteredMatches
  .map(
    (match, index) => `
Source ${index + 1}

File: ${match.metadata.fileName}

Page: ${match.metadata.page_number ?? match.metadata.page ?? 1}

Similarity: ${match.score.toFixed(2)}

Content:
${match.metadata.text}
`
  )
  .join("\n\n-----------------------\n\n");


    if (filteredMatches.length > 0 || chatHistory.length > 0) {
      answer = await generateAnswer(question, context, chatHistory, {
        onToken: (token) => sendEvent({ type: "token", token }),
      });

      sources = filteredMatches.map((match) => ({
  fileName: match.metadata.fileName,
  page: match.metadata.page_number ?? match.metadata.page ?? 1,
  score: Number(match.score.toFixed(3)),
  text: match.metadata.text,
}));
    } else {
      sendEvent({ type: "token", token: answer });
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

    userMessage.turnStatus = "complete";
    await userMessage.save();

    // -------------------------
    // Response
    // -------------------------

    sendEvent({ type: "done", answer, sources });
    return res.end();

  } catch (error) {

    console.error("Send message failed.");
    if (userMessage) {
      userMessage.turnStatus = "failed";
      await userMessage.save().catch(() => {});
    }

    if (res.headersSent) {
      if (!res.writableEnded && !res.destroyed) {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Unable to generate a response. Please try again." })}\n\n`);
        res.end();
      }
      return;
    }
    return res.status(500).json({ success: false, message: "Unable to generate a response. Please try again." });

  }

};


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

    console.error("Delete conversation failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to delete conversation.",
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

   console.error("Rename conversation failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to rename conversation.",
    });

  }

};

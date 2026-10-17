const Document = require("../models/Document");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getStats = async (req, res) => {
  try {
    // ==========================
    // Total Documents
    // ==========================
    const totalDocuments = await Document.countDocuments({
      user: req.user.id,
    });

    // ==========================
    // User Conversations
    // ==========================
    const conversations = await Conversation.find({
      user: req.user.id,
    }).select("_id");

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    // ==========================
    // Total Questions (User Messages)
    // ==========================
    const totalQuestions = await Message.countDocuments({
      conversation: {
        $in: conversationIds,
      },
      role: "user",
    });

    // ==========================
    // Total Vectors
    // ==========================
  
  const docs = await Document.find(
  { user: req.user.id },
  "vectorCount originalName user"
);


const totalVectors = docs.reduce(
  (sum, doc) => sum + (doc.vectorCount || 0),
  0
);

    res.status(200).json({
      success: true,
      stats: {
        documents: totalDocuments,
        questions: totalQuestions,
        vectors: totalVectors,
        aiStatus: "Online",
      },
    });
  } catch (err) {
    console.error("Dashboard stats lookup failed.");

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
    });
  }
};

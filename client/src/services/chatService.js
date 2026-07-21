import api from "./api";

// ==============================
// Create New Conversation
// ==============================

export const createConversation = async () => {
  const res = await api.post("/chat/new");
  return res.data;
};

// ==============================
// Get All Conversations
// ==============================

export const getConversations = async () => {
  const res = await api.get("/chat/conversations");
  return res.data;
};

// ==============================
// Get Single Conversation
// ==============================

export const getConversation = async (conversationId) => {
  const res = await api.get(`/chat/${conversationId}`);
  return res.data;
};

// ==============================
// Send Message
// ==============================

export const sendMessage = async (
  conversationId,
  question
) => {
  const res = await api.post(
    `/chat/${conversationId}`,
    {
      question,
    }
  );

  return res.data;
};

// ==============================
// Delete Conversation
// ==============================

export const deleteConversation = async (
  conversationId
) => {
  const res = await api.delete(
    `/chat/${conversationId}`
  );

  return res.data;
};
// ==============================
// Rename Conversation
// ==============================

export const renameConversation = async (
  conversationId,
  title
) => {
  const res = await api.patch(
    `/chat/${conversationId}`,
    {
      title,
    }
  );

  return res.data;
};

// ==============================
// Old Chat History
// (Backward Compatibility)
// ==============================

export const getChatHistory = async () => {
  const res = await api.get("/chat/history");
  return res.data;
};
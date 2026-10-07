import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Sparkles } from "lucide-react";

import api from "../../services/api";

import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import TypingLoader from "./TypingLoader";

import Modal from "../common/Modal";
import UploadBox from "../dashboard/UploadBox";

import {
  getConversations,
} from "../../services/chatService";

function ChatBox({
  activeConversation,
  setActiveConversation,
  setConversations,
  onDocumentUploaded,
  selectedDocument,
  suggestionRequest,
})  {
  const [messages, setMessages] = useState([]);
const [question, setQuestion] = useState("");
const [loading, setLoading] = useState(false);
const [showUploadModal, setShowUploadModal] =
  useState(false);
const [documentQuestions, setDocumentQuestions] = useState([]);
const [preparingQuestions, setPreparingQuestions] = useState(false);

const chatRef = useRef(null);
const activeConversationId = activeConversation?._id;

const loadConversation = useCallback(async () => {
  if (!activeConversationId) {
    setMessages([]);
    return;
  }

  try {
    const res = await api.get(`/chat/${activeConversationId}`);
    const history = res.data.messages.map((msg) => ({
      role: msg.role,
      text: msg.content,
      sources: msg.sources || [],
    }));

    setMessages(history);
    localStorage.setItem("activeConversation", activeConversationId);
  } catch (err) {
    console.log(err);
  }
}, [activeConversationId]);

  // ==========================
  // Load Conversation

  // ==========================

useEffect(() => {
  loadConversation();
}, [loadConversation]);
useEffect(() => {
  if (suggestionRequest?.text) {
    setQuestion(suggestionRequest.text);
  }
}, [suggestionRequest]);
useEffect(() => {
  if (selectedDocument) {
    setPreparingQuestions(false);
    setDocumentQuestions(Array.isArray(selectedDocument.suggestedQuestions)
      ? selectedDocument.suggestedQuestions.slice(0, 3)
      : []);
  }
}, [selectedDocument]);
useEffect(() => {

  if (chatRef.current) {

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight;

  }

}, [messages, loading]);
 function handleUploadSuccess(document) {

  setShowUploadModal(false);
  setPreparingQuestions(false);
  setDocumentQuestions(Array.isArray(document?.suggestedQuestions)
    ? document.suggestedQuestions.slice(0, 3)
    : []);

  if (onDocumentUploaded) {

    onDocumentUploaded(document);

  }

}
async function refreshConversations() {

  try {

    const res = await getConversations();

    const updated = res.conversations || [];

    setConversations(updated);

    if (activeConversation) {

      const latestConversation =
        updated.find(
          (c) =>
            c._id === activeConversation._id
        );

      if (latestConversation) {

        setActiveConversation(
          latestConversation
        );

        localStorage.setItem(
          "activeConversation",
          latestConversation._id
        );

      }

    }

  } catch (err) {

    console.log(err);

  }

}
  // ==========================
  // Auto Scroll
  // ==========================


  // ==========================
  // Load Messages
  // ==========================

  // ==========================
  // Send Question
  // ==========================

  async function sendQuestion(questionOverride) {

  if (!activeConversation) {

    alert("Please create a new chat.");

    return;

  }

  const textToSend = (questionOverride ?? question).trim();
  if (!textToSend) return;

  const currentQuestion = textToSend;
  const conversationId = activeConversation._id;
  const streamId = `stream-${Date.now()}`;

  // Show user message instantly

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text: currentQuestion,
    },
    {
      id: streamId,
      role: "assistant",
      text: "",
      sources: [],
    },
  ]);

  setQuestion("");

  try {

    setLoading(true);

    const token = localStorage.getItem("token");
    const response = await fetch(
      `${api.defaults.baseURL}/chat/${conversationId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: currentQuestion }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `Chat request failed (${response.status})`);
    }
    if (!response.body) throw new Error("Streaming is not supported by this browser.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed = false;

    const handleEvent = (rawEvent) => {
      const data = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) return;

      const event = JSON.parse(data);
      if (event.type === "token") {
        setMessages((prev) => prev.map((message) =>
          message.id === streamId
            ? { ...message, text: message.text + event.token }
            : message
        ));
      } else if (event.type === "done") {
        completed = true;
        setMessages((prev) => prev.map((message) =>
          message.id === streamId
            ? { ...message, text: event.answer, sources: event.sources || [] }
            : message
        ));
      } else if (event.type === "error") {
        throw new Error(event.message || "The AI response failed.");
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      events.forEach(handleEvent);
      if (done) break;
    }
    if (buffer.trim()) handleEvent(buffer);
    if (!completed) throw new Error("The response stream ended unexpectedly.");

    // Refresh sidebar
    await refreshConversations();

    // Reload messages from DB
    await loadConversation();

  } catch (err) {

    console.log(err);

    setMessages((prev) => prev.map((message) =>
      message.id === streamId
        ? { ...message, text: message.text || err.message || "Something went wrong." }
        : message
    ));

  } finally {

    setLoading(false);

  }

}
  return (
    <>
    <div className="h-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">

      {/* Header */}

      <div className="flex-shrink-0 border-b border-slate-700 bg-slate-900/95 backdrop-blur px-6 py-4">

        <div className="flex items-center gap-4">

          <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Bot
              size={28}
              className="text-cyan-400"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              PrepGenius AI
            </h2>

            <p className="text-slate-400">
              Interview Preparation Assistant
            </p>
          </div>

          <div className="ml-auto">

            <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1">

              <Sparkles
                size={16}
                className="text-emerald-400"
              />

              <span className="text-sm text-emerald-300">
                Online
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Messages */}

      <div
        ref={chatRef}
        className="flex-1 min-h-0 overflow-y-auto px-6 py-6 bg-gradient-to-b from-slate-900 to-slate-950"
      >

        <ChatWindow
          messages={messages}
        />

        {loading && <TypingLoader />}

      </div>

      {/* Input */}

      <div className="flex-shrink-0 border-t border-slate-700 bg-slate-900/95 backdrop-blur px-5 py-4">
     {(preparingQuestions || documentQuestions.length > 0) && (
       <div className="mb-3" aria-live="polite">
         {preparingQuestions ? (
           <p className="text-xs text-slate-400">Preparing questions from your document...</p>
         ) : (
           <>
             <p className="mb-2 text-xs font-medium text-slate-400">You can ask:</p>
             <div className="flex flex-wrap gap-2">
               {documentQuestions.map((suggestedQuestion, index) => (
                 <button
                   key={`${index}-${suggestedQuestion}`}
                   type="button"
                   disabled={loading}
                   onClick={() => sendQuestion(suggestedQuestion)}
                   className="max-w-full truncate rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-left text-xs text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
                   title={suggestedQuestion}
                 >
                   {suggestedQuestion}
                 </button>
               ))}
             </div>
           </>
         )}
       </div>
     )}
     <ChatInput
    value={question}
    setValue={setQuestion}
    onSend={sendQuestion}
    loading={loading}
    onUploadClick={() => setShowUploadModal(true)}
/>

      </div>

    </div>
    <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Study Material">

  <UploadBox
    onUploadStart={() => { setDocumentQuestions([]); setPreparingQuestions(true); }}
    onUploadFailure={() => setPreparingQuestions(false)}
    onUploadSuccess={handleUploadSuccess}
  />
</Modal>
</>
  );
}

export default ChatBox;

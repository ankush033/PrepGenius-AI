import { useEffect, useRef, useState } from "react";
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
  conversations,
  setConversations,
  onDocumentUploaded,
})  {
  const [messages, setMessages] = useState([]);
const [question, setQuestion] = useState("");
const [loading, setLoading] = useState(false);
const [showUploadModal, setShowUploadModal] =
  useState(false);

const chatRef = useRef(null);

  // ==========================
  // Load Conversation

  // ==========================

useEffect(() => {

  if (activeConversation) {

    loadConversation();

  } else {

    setMessages([]);

  }

}, [activeConversation]);
useEffect(() => {

  if (chatRef.current) {

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight;

  }

}, [messages, loading]);
 function handleUploadSuccess() {

  setShowUploadModal(false);

  if (onDocumentUploaded) {

    onDocumentUploaded();

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

 async function loadConversation() {

  try {

    const res = await api.get(
      `/chat/${activeConversation._id}`
    );
        console.log("Conversation API Response");
    console.log(res.data.messages);
    const history = res.data.messages.map((msg) => ({

      role: msg.role,

      text: msg.content,

      sources: msg.sources || [],

    }));

    setMessages(history);
    localStorage.setItem(
  "activeConversation",
  activeConversation._id
);

  } catch (err) {

    console.log(err);

  }

}


  // ==========================
  // Send Question
  // ==========================

  async function sendQuestion() {

  if (!activeConversation) {

    alert("Please create a new chat.");

    return;

  }

  if (!question.trim()) return;

  const currentQuestion = question;

  // Show user message instantly

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text: currentQuestion,
    },
  ]);

  setQuestion("");

  try {

    setLoading(true);

    const res = await api.post(
      `/chat/${activeConversation._id}`,
      {
        question: currentQuestion,
      }
    );
console.log("Full Response:", res.data);
console.log("Sources:", res.data.sources);


 


    // Show AI message instantly

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: res.data.answer,
        sources: res.data.sources || [],
      },
    ]);

    // Refresh sidebar
    await refreshConversations();

    // Reload messages from DB
    await loadConversation();

  } catch (err) {

    console.log(err);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Something went wrong.",
        sources: [],
      },
    ]);

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

  <UploadBox  onUploadSuccess={handleUploadSuccess} />
</Modal>
</>
  );
}

export default ChatBox;
import { useEffect, useState } from "react";

import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";

import { getConversations } from "../../services/chatService";

function DashboardLayout({ children }) {

  const [conversations, setConversations] = useState([]);

  const [activeConversation, setActiveConversation] =
    useState(null);

  // ===========================
  // Load conversations once
  // ===========================

  useEffect(() => {

    loadConversations();

  }, []);

  async function loadConversations() {

    try {

      const res = await getConversations();

      const chats = res.conversations || [];

      setConversations(chats);

      if (chats.length === 0) {

        setActiveConversation(null);

        return;

      }

      const savedId =
        localStorage.getItem("activeConversation");

      if (savedId) {

        const savedChat = chats.find(
          (chat) => chat._id === savedId
        );

        if (savedChat) {

          setActiveConversation(savedChat);

          return;

        }

      }

      setActiveConversation(chats[0]);

    } catch (err) {

      console.log(err);

    }

  }

  return (

    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">

      <Navbar />

      <div className="flex flex-1 min-h-0">

        <Sidebar
          conversations={conversations}
          setConversations={setConversations}
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
        />

        <main className="flex-1 min-h-0 overflow-hidden p-5">

          {children({
            conversations,
            setConversations,
            activeConversation,
            setActiveConversation,
          })}

        </main>

      </div>

    </div>

  );

}

export default DashboardLayout;
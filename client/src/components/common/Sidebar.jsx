import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Plus,
  Bot,
  Clock,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

import {
  createConversation,
  deleteConversation,
  renameConversation,
} from "../../services/chatService";

function Sidebar({
  conversations,
  setConversations,
  activeConversation,
  setActiveConversation,
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

const [editedTitle, setEditedTitle] = useState("");
 const [openMenu, setOpenMenu] = useState(null);
  // ===========================
  // Create New Chat
  // ===========================

  async function handleNewChat() {
    try {
      const res = await createConversation();

      const newConversation = res.conversation;

      const updated = [
        newConversation,
        ...conversations,
      ];

      setConversations(updated);

      setActiveConversation(newConversation);

      localStorage.setItem(
        "activeConversation",
        newConversation._id
      );
    } catch (err) {
      console.log(err);
    }
  }

  // ===========================
  // Delete Chat
  // ===========================

  async function handleDelete(chatId) {
    try {
      await deleteConversation(chatId);

      const updated = conversations.filter(
        (chat) => chat._id !== chatId
      );

      setConversations(updated);

      if (activeConversation?._id === chatId) {
        if (updated.length > 0) {
          setActiveConversation(updated[0]);

          localStorage.setItem(
            "activeConversation",
            updated[0]._id
          );
        } else {
          setActiveConversation(null);

          localStorage.removeItem(
            "activeConversation"
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  // ===========================
// Rename Chat
// ===========================

async function handleRename(chatId) {

  if (!editedTitle.trim()) return;

  try {

    await renameConversation(
      chatId,
      editedTitle
    );

    const updated = conversations.map((chat) =>
      chat._id === chatId
        ? {
            ...chat,
            title: editedTitle,
          }
        : chat
    );

    setConversations(updated);

    if (activeConversation?._id === chatId) {

      setActiveConversation({
        ...activeConversation,
        title: editedTitle,
      });

    }

    setEditingId(null);

    setEditedTitle("");

  } catch (err) {

    console.log(err);

  }

}

  // ===========================
  // Search
  // ===========================

  const filteredConversations =
    conversations.filter((chat) =>
      chat.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <aside className="w-[270px] flex-shrink-0 h-full bg-slate-950 border-r border-slate-800 flex flex-col">

      {/* Brand */}

      <div className="px-5 py-5 border-b border-slate-800">

        <div className="flex items-center gap-3">

          <div className="h-11 w-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">

            <Bot
              size={26}
              className="text-cyan-400"
            />

          </div>

          <div>

            <h2 className="font-bold text-lg tracking-wide">

              <span className="text-white">
                Prep
              </span>

              <span className="text-cyan-400">
                Genius
              </span>

            </h2>

            <p className="text-xs text-slate-400">

              AI Interview Assistant

            </p>

          </div>

        </div>

      </div>

      {/* New Chat */}

      <div className="p-4">

        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition py-3 px-4 font-semibold text-slate-950"
        >

          <Plus size={20} />

          <span>New Chat</span>

        </button>

      </div>

      {/* Search */}

      <div className="px-4 pb-4 border-b border-slate-800">

        <div className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3">

          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search history"
            className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500"
          />

        </div>

      </div>

      {/* Conversation List */}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">

        {filteredConversations.length === 0 ? (

          <div className="text-center text-slate-500 text-sm mt-10">

            No conversations yet

          </div>

        ) : (

          filteredConversations.map((chat) => (

            <div
              key={chat._id}
              className={`rounded-2xl border transition-all duration-200 p-3 ${
                activeConversation?._id ===
                chat._id
                  ? "border-cyan-500/40 bg-cyan-500/10"
                  : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800"
              }`}
            >

              <div className="flex items-start justify-between gap-2">

                {/* Left */}

                <button
                  onClick={() => {
                    setActiveConversation(chat);

                    localStorage.setItem(
                      "activeConversation",
                      chat._id
                    );
                  }}
                  className="flex items-start gap-3 flex-1 text-left"
                >

                  <div
                    className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center ${
                      activeConversation?._id ===
                      chat._id
                        ? "bg-cyan-500/20"
                        : "bg-slate-800"
                    }`}
                  >

                    <MessageSquare
                      size={16}
                      className={
                        activeConversation?._id ===
                        chat._id
                          ? "text-cyan-400"
                          : "text-slate-400"
                      }
                    />

                  </div>

                  <div className="flex-1 min-w-0">

                   {
  editingId === chat._id ? (
    <input
      value={editedTitle}
      onChange={(e) =>
        setEditedTitle(e.target.value)
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleRename(chat._id);
        }

        if (e.key === "Escape") {
          setEditingId(null);
          setEditedTitle("");
        }
      }}
      autoFocus
      className="w-full bg-slate-800 rounded px-2 py-1 text-sm text-white outline-none"
    />
  ) : (
    <p className="text-sm font-medium truncate text-white">
      {chat.title}
    </p>
  )
}
                    <div className="flex items-center gap-1 mt-1">

                      <Clock
                        size={12}
                        className="text-slate-500"
                      />

                      <p className="text-xs text-slate-500">

                        {new Date(
                          chat.updatedAt
                        ).toLocaleDateString()}

                      </p>

                    </div>

                  </div>

                </button>

                {/* Delete */}
              <div className="relative">

  <button
    onClick={(e) => {
      e.stopPropagation();

      if (openMenu === chat._id) {

        setOpenMenu(null);

      } else {

        setOpenMenu(chat._id);

      }

    }}
    className="p-1 rounded-lg hover:bg-slate-700"
  >

    <MoreVertical size={17} />

  </button>

  {openMenu === chat._id && (

    <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50">

       <button
  onClick={() => {

    setOpenMenu(null);

    setEditingId(chat._id);

    setEditedTitle(chat.title);

  }}
  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-800 text-sm"
>

  <Pencil size={15} />

  Rename

</button>


      <button
        onClick={() => {

          setOpenMenu(null);

          if (
            window.confirm(
              "Delete this conversation?"
            )
          ) {

            handleDelete(chat._id);

          }

        }}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/20 text-red-400 text-sm"
      >

        <Trash2 size={15} />

        Delete

      </button>

    </div>

  )}

</div>

              </div>

            </div>

          ))

        )}

      </div>
      {/* Logout */}
      {/* Logout */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("activeConversation");
            window.location.href = "/";
          }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 transition"
        >
          <Trash2 size={18} />
          Logout
        </button>
      </div>

      {/* Footer */}

      <div className="p-4 border-t border-slate-800">

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3">

          <p className="text-xs text-slate-400 leading-relaxed">

            Upload PDFs and continue previous interview preparation chats from history.

          </p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
import { Plus, Send } from "lucide-react";

function ChatInput({
  value,
  setValue,
  onSend,
  loading,
  onUploadClick,
}) {

  const handleKeyDown = (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();

      onSend();

    }

  };

  return (

    <div className="flex items-end gap-3">

      {/* Input */}

      <div className="flex flex-1 items-end gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2">

        {/* Upload */}

        <button
          type="button"
          disabled={loading}
          onClick={onUploadClick}
          className="h-11 w-11 rounded-xl hover:bg-slate-700 transition flex items-center justify-center text-cyan-400 disabled:opacity-50"
        >

          <Plus size={22} />

        </button>

        {/* Text */}

        <textarea
          rows={1}
          value={value}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything from your PDFs..."
          className="flex-1 bg-transparent outline-none resize-none py-2 text-white placeholder:text-slate-400 max-h-40"
        />

      </div>

      {/* Send */}

      <button
        disabled={loading}
        onClick={onSend}
        className="h-14 w-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition flex items-center justify-center disabled:opacity-50"
      >

        <Send size={20} />

      </button>

    </div>

  );

}

export default ChatInput;
import SourceCard from "./SourceCard";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

function ChatMessage({
  role,
  text,
  sources = [],
}) {

  const isUser = role === "user";

  return (
    <div
      className={`flex ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >

      <div
        className={`max-w-[80%] rounded-2xl p-5 ${
          isUser
            ? "bg-cyan-500 text-white"
            : "bg-slate-800 border border-slate-700"
        }`}
      >

        {
          isUser ? (

            <p className="whitespace-pre-wrap leading-7">
              {text}
            </p>

          ) : (

            <div className="prose prose-invert max-w-none">

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {text}
              </ReactMarkdown>

            </div>

          )
        }

        {

          !isUser &&
          sources.length > 0 && (

            <div className="mt-5">

              <h4 className="mb-3 text-sm font-semibold text-cyan-400">
  📄 Sources Used
</h4>

              <div className="space-y-3">

                {

                  sources.map((source, index) => (

                    <SourceCard
                      key={index}
                      source={source}
                    />

                  ))

                }

              </div>

            </div>

          )

        }

      </div>

    </div>
  );

}

export default ChatMessage;
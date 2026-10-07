import { ChevronDown, FileText, Trash2, CalendarDays } from "lucide-react";

function DocumentCard({ document, expanded, onToggle, onDelete, onQuestionSelect }) {
  const suggestedQuestions = Array.isArray(document.suggestedQuestions)
    ? document.suggestedQuestions.slice(0, 3)
    : [];

  return (
    <article className={`group rounded-xl border bg-slate-900 transition-colors ${expanded ? "border-cyan-500/60" : "border-slate-800 hover:border-slate-700"}`}>
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="shrink-0 rounded-lg bg-cyan-500/10 p-2">
            <FileText className="text-cyan-400" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white" title={document.originalName}>
              {document.originalName}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarDays size={13} />
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
          </span>
          <ChevronDown
            size={17}
            className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180 text-cyan-400" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={() => onDelete(document._id)}
          aria-label={`Delete ${document.originalName}`}
          className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 px-3 pb-3 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-300">
            {document.summary || "Summary unavailable"}
          </p>

          {suggestedQuestions.length > 0 && (
            <div className="mt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Suggested questions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={`${document._id}-suggestion-${index}`}
                    type="button"
                    onClick={() => onQuestionSelect?.(question)}
                    className="max-w-full rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-left text-xs leading-4 text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default DocumentCard;

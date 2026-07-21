import { useState } from "react";

function SourceCard({ source }) {

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">

      <div className="bg-slate-700 px-4 py-3">
        <h3 className="font-semibold text-cyan-400">
          {source.fileName}
        </h3>

        <p className="text-green-400 text-sm">
          Similarity: {(source.score * 100).toFixed(1)}%
        </p>
      </div>

      <div className="p-4">

        <p className="text-sm whitespace-pre-wrap text-slate-300">
          {expanded
            ? source.text
            : source.text.substring(0, 300) + "..."}
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-cyan-400 text-sm hover:underline"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>

      </div>

    </div>
  );
}

export default SourceCard;
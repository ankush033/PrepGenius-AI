import { FileText, Trash2, CalendarDays } from "lucide-react";

function DocumentCard({ document, onDelete }) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900 hover:border-cyan-500 transition-all duration-300 p-4">

      <div className="flex items-start justify-between">

        <div className="flex gap-3">

          <div className="p-3 rounded-lg bg-cyan-500/10">
            <FileText className="text-cyan-400" size={22} />
          </div>

          <div>

            <h3 className="font-semibold text-white break-all">
              {document.originalName}
            </h3>

            <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">

              <CalendarDays size={15} />

              {new Date(document.createdAt).toLocaleDateString()}

            </div>

          </div>

        </div>

        <button
          onClick={() => onDelete(document._id)}
          className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-500"
        >
          <Trash2 size={20} />
        </button>

      </div>

    </div>
  );
}

export default DocumentCard;
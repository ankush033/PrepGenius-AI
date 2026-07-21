import { useEffect, useState } from "react";
import api from "../../services/api";
import DocumentCard from "./DocumentCard";
import { FolderOpen, Search } from "lucide-react";

function DocumentList({ refreshDocs }) {

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {

    fetchDocuments();

  }, [refreshDocs]);

  async function fetchDocuments() {

    try {

      const res = await api.get("/documents");

      setDocuments(res.data.documents);

    } catch (err) {

      console.log(err);

    }

  }

  async function deleteDocument(id) {

    if (!window.confirm("Delete this document?")) return;

    try {

      await api.delete(`/documents/${id}`);

      setDocuments((prev) =>
        prev.filter((doc) => doc._id !== id)
      );

    } catch (err) {

      alert(err.response?.data?.message);

    }

  }

  const filteredDocuments = documents.filter((doc) =>
    doc.originalName
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (

    <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">

      {/* Header */}

      <div className="p-5 border-b border-slate-800">

        <div className="flex items-center gap-3">

          <FolderOpen
            className="text-cyan-400"
            size={22}
          />

          <div>

            <h2 className="font-bold text-lg">

              Uploaded Documents

            </h2>

            <p className="text-sm text-slate-400">

              {documents.length} Files

            </p>

          </div>

        </div>

        {/* Search */}

        <div className="relative mt-5">

          <Search
            size={18}
            className="absolute left-3 top-3 text-slate-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search PDF..."
            className="w-full rounded-xl bg-slate-800 border border-slate-700 py-3 pl-10 pr-4 outline-none focus:border-cyan-500"
          />

        </div>

      </div>

      {/* Documents */}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {

          filteredDocuments.length === 0 ? (

            <div className="flex justify-center items-center h-full text-slate-500">

              No Documents Uploaded

            </div>

          ) : (

            filteredDocuments.map((doc) => (

              <DocumentCard
                key={doc._id}
                document={doc}
                onDelete={deleteDocument}
              />

            ))

          )

        }

      </div>

    </div>

  );

}

export default DocumentList;
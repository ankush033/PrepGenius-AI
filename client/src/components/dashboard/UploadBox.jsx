import { useState } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
} from "lucide-react";

import api from "../../services/api";

function UploadBox({
  onUploadSuccess,
}) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {

    if (!file) {
      return alert("Please select a PDF");
    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("pdf", file);

      const res = await api.post(
        "/documents/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      alert(res.data.message);

      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Upload Failed"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="rounded-2xl bg-slate-900">

      <div className="flex items-center gap-3 mb-6">

        <UploadCloud
          className="text-cyan-400"
          size={28}
        />

        <div>

          <h2 className="text-xl font-bold">
            Upload Study Material
          </h2>

          <p className="text-slate-400 text-sm">
            Upload PDFs and ask AI questions instantly.
          </p>

        </div>

      </div>

      <label className="border-2 border-dashed border-slate-700 rounded-xl h-36 flex flex-col justify-center items-center cursor-pointer hover:border-cyan-500 transition">

        <FileText
          size={42}
          className="text-cyan-400 mb-3"
        />

        <p className="font-semibold">

          {file
            ? file.name
            : "Click to select PDF"}

        </p>

        <span className="text-slate-400 text-sm mt-2">
          PDF only
        </span>

        <input
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

      </label>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 transition py-3 font-semibold flex justify-center items-center gap-2"
      >

        {loading ? (
          <>
            <Loader2
              className="animate-spin"
              size={18}
            />

            Uploading...

          </>
        ) : (
          <>
            <UploadCloud size={18} />

            Upload PDF

          </>
        )}

      </button>

    </div>

  );

}

export default UploadBox;
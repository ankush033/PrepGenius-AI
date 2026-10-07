import { useState } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
} from "lucide-react";

import api from "../../services/api";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function UploadBox({
  onUploadSuccess,
  onUploadStart,
  onUploadFailure,
}) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadSent, setUploadSent] = useState(false);

  async function handleUpload() {

    if (!file) {
      return alert("Please select a PDF");
    }

    try {

      setLoading(true);
      setUploadSent(false);
      onUploadStart?.();

      const formData = new FormData();

      formData.append("pdf", file);

      const res = await api.post(
        "/documents/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total && event.loaded >= event.total) {
              setUploadSent(true);
            }
          },
        }
      );

      alert(res.data.message);

      setFile(null);

      onUploadSuccess?.(res.data.document);

    } catch (err) {

      onUploadFailure?.();

      alert(
        err.response?.data?.message ||
        err.message ||
        "Upload failed. Check the server logs for the failed pipeline stage."
      );

    } finally {

      setLoading(false);
      setUploadSent(false);

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
          PDF only · 100 MB maximum
        </span>

        <input
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
              alert("PDF must be 100 MB or smaller.");
              e.target.value = "";
              setFile(null);
              return;
            }
            setFile(selectedFile || null);
          }}
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

            {uploadSent ? "PDF received; processing…" : "Uploading PDF…"}

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

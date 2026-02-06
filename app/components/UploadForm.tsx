"use client";

import { useRef, useState } from "react";

type UploadFormProps = {
  onUploaded: (documentId: string) => void;
  onError: (message: string) => void;
};

export default function UploadForm({ onUploaded, onError }: UploadFormProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      onError("Please select a PDF or TXT file.");
      return;
    }

    setLoading(true);
    onError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Upload failed");
      }

      onUploaded(payload.document.id as string);
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-semibold text-slate-900">Upload a document</h2>
      <p className="mt-1 text-sm text-slate-600">
        Accepted formats: PDF, TXT (max 10 MB). We will store the file, extract text, and
        generate a summary.
      </p>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Choose file
        <input
          ref={fileInputRef}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
        />
      </label>
      {fileName ? <p className="mt-2 text-xs text-slate-500">{fileName}</p> : null}
      <button
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Processing..." : "Upload and summarize"}
      </button>
    </form>
  );
}

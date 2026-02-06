"use client";

import type { DocumentRecord } from "../lib/types";

type DocumentsListProps = {
  documents: DocumentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const formatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function DocumentsList({
  documents,
  selectedId,
  onSelect,
}: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
        No documents yet. Upload your first PDF or TXT file to see summaries here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <button
          key={doc.id}
          type="button"
          onClick={() => onSelect(doc.id)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
            selectedId === doc.id
              ? "border-slate-900 bg-white"
              : "border-slate-200 bg-white/70 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{doc.file_name}</p>
              <p className="text-xs text-slate-500">{formatter.format(new Date(doc.created_at))}</p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                doc.summary_status === "completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : doc.summary_status === "failed"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {doc.summary_status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

"use client";

import type { DocumentRecord } from "../lib/types";

type SummaryPanelProps = {
  document: DocumentRecord | null;
};

export default function SummaryPanel({ document }: SummaryPanelProps) {
  if (!document) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
        Select a document to view the summary.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
          <p className="text-xs text-slate-500">{document.file_name}</p>
        </div>
        {document.file_url ? (
          <a
            className="text-xs font-semibold text-slate-600 underline"
            href={document.file_url}
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        ) : null}
      </div>
      <div className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
        {document.summary
          ? document.summary
          : document.summary_status === "failed"
          ? "Summary failed. Try uploading again."
          : "Summary is still processing. Refresh in a moment."}
      </div>
    </div>
  );
}
